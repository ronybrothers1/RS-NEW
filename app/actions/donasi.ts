"use server";

import {
  and,
  eq,
  sql,
} from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { rateLimit } from "@/lib/rate-limit";
import {
  validatePrivateDonationProof,
} from "@/lib/donation-proof-media";
import { db } from "@/src/db";
import {
  campaigns,
  donations,
  programs,
  settings,
} from "@/src/db/schema";

const SUPPORTED_BANKS =
  new Set([
    "BCA",
    "MANDIRI",
    "BSI",
    "BRI",
  ]);

type ProofValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

function cleanText(
  value:
    | FormDataEntryValue
    | null,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function isUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function submitDonation(
  _prevState: unknown,
  formData: FormData,
) {
  const headersList =
    await headers();

  const forwardedFor =
    headersList.get(
      "x-forwarded-for",
    );

  const ip =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    headersList.get(
      "x-real-ip",
    ) ||
    "unknown-ip";

  const {
    success:
      rateLimitSuccess,
  } = rateLimit(
    `donation-submit-${ip}`,
    5,
    60 * 1000,
  );

  if (!rateLimitSuccess) {
    return {
      success: false,
      error:
        "Terlalu banyak permintaan. Silakan coba beberapa saat lagi.",
    };
  }

  const donorName =
    cleanText(
      formData.get(
        "donorName",
      ),
    );

  const amountRaw =
    cleanText(
      formData.get(
        "amount",
      ),
    );

  const programId =
    cleanText(
      formData.get(
        "programId",
      ),
    );

  const campaignId =
    cleanText(
      formData.get(
        "campaignId",
      ),
    );

  const paymentMethod =
    cleanText(
      formData.get(
        "paymentMethod",
      ),
    ).toUpperCase();

  const proofImageUrl =
    cleanText(
      formData.get(
        "proofImageUrl",
      ),
    );

  const isAnonymous =
    formData.get(
      "isAnonymous",
    ) === "on";

  if (
    !donorName ||
    !amountRaw ||
    !programId ||
    !paymentMethod ||
    !proofImageUrl
  ) {
    return {
      success: false,
      error:
        "Data donasi belum lengkap.",
    };
  }

  if (
    donorName.length >
    180
  ) {
    return {
      success: false,
      error:
        "Nama maksimal 180 karakter.",
    };
  }

  if (
    !isUuid(programId)
  ) {
    return {
      success: false,
      error:
        "Program yang dipilih tidak valid.",
    };
  }

  if (
    campaignId &&
    !isUuid(campaignId)
  ) {
    return {
      success: false,
      error:
        "Kampanye yang dipilih tidak valid.",
    };
  }

  const amount =
    Number(
      amountRaw.replace(
        /\D/g,
        "",
      ),
    );

  if (
    !Number.isSafeInteger(
      amount,
    ) ||
    amount < 10000
  ) {
    return {
      success: false,
      error:
        "Minimal donasi adalah Rp10.000.",
    };
  }

  if (
    !SUPPORTED_BANKS.has(
      paymentMethod,
    )
  ) {
    return {
      success: false,
      error:
        "Metode pembayaran tidak valid.",
    };
  }

  const proofValidation =
    await validatePrivateDonationProof(
      proofImageUrl,
    );

  if (
    !proofValidation.success
  ) {
    return {
      success: false,
      error:
        proofValidation.error,
    };
  }

  try {
    const settingKey =
      `bank_${paymentMethod.toLowerCase()}`;

    const [
      selectedPrograms,
      bankSettings,
      existingProof,
    ] = await Promise.all([
      db
        .select({
          id: programs.id,
        })
        .from(programs)
        .where(
          and(
            eq(
              programs.id,
              programId,
            ),
            eq(
              programs.status,
              "ACTIVE",
            ),
          ),
        )
        .limit(1),

      db
        .select({
          value:
            settings.value,
        })
        .from(settings)
        .where(
          eq(
            settings.key,
            settingKey,
          ),
        )
        .limit(1),

      db
        .select({
          id: donations.id,
        })
        .from(donations)
        .where(
          eq(
            donations.proofImage,
            proofImageUrl,
          ),
        )
        .limit(1),
    ]);

    if (
      !selectedPrograms[0]
    ) {
      return {
        success: false,
        error:
          "Program tersebut tidak tersedia atau sedang nonaktif.",
      };
    }

    if (
      !bankSettings[0]
        ?.value
        ?.trim()
    ) {
      return {
        success: false,
        error:
          "Metode pembayaran tersebut sedang tidak tersedia.",
      };
    }

    if (existingProof[0]) {
      return {
        success: false,
        error:
          "Bukti transfer ini sudah pernah dikirim.",
      };
    }

    let campaignSlug:
      string | null = null;

    if (campaignId) {
      const [
        selectedCampaign,
      ] =
        await db
          .select({
            id:
              campaigns.id,
            programId:
              campaigns.programId,
            slug:
              campaigns.slug,
            status:
              campaigns.status,
          })
          .from(campaigns)
          .where(
            eq(
              campaigns.id,
              campaignId,
            ),
          )
          .limit(1);

      if (
        !selectedCampaign ||
        selectedCampaign.status !==
          "ACTIVE" ||
        selectedCampaign.programId !==
          programId
      ) {
        return {
          success: false,
          error:
            "Kampanye sudah tidak aktif atau tidak sesuai dengan program yang dipilih.",
        };
      }

      campaignSlug =
        selectedCampaign.slug;
    }

    const inserted =
      await db.transaction(
        async (tx) => {
          await tx.execute(
            sql`SELECT pg_advisory_xact_lock(hashtext(${proofImageUrl}))`,
          );

          const [duplicate] =
            await tx
              .select({
                id: donations.id,
              })
              .from(donations)
              .where(
                eq(
                  donations.proofImage,
                  proofImageUrl,
                ),
              )
              .limit(1);

          if (duplicate) {
            return false;
          }

          await tx
            .insert(donations)
            .values({
              donorName,
              amount:
                amount.toString(),
              programId,
              campaignId:
                campaignId ||
                null,
              paymentMethod,
              isAnonymous,
              proofImage:
                proofImageUrl,
              status:
                "PENDING",
            });

          return true;
        },
      );

    if (!inserted) {
      return {
        success: false,
        error:
          "Bukti transfer ini sudah pernah dikirim.",
      };
    }

    revalidatePath(
      "/admin/donasi",
    );

    revalidatePath(
      "/admin/dashboard",
    );

    revalidatePath(
      "/bantuan",
    );

    if (campaignSlug) {
      revalidatePath(
        `/bantuan/${campaignSlug}`,
      );
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(
      "Submit donation error:",
      error,
    );

    return {
      success: false,
      error:
        "Gagal memproses donasi. Silakan coba lagi.",
    };
  }
}