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

function formatDonationReference(
  donationId: string,
) {
  return `RS-DON-${donationId.toUpperCase()}`;
}

function parseDonationReference(
  value: string,
) {
  const normalized =
    value
      .trim()
      .toUpperCase();

  const prefix =
    "RS-DON-";

  const rawId =
    normalized.startsWith(
      prefix,
    )
      ? normalized.slice(
          prefix.length,
        )
      : normalized;

  const donationId =
    rawId.toLowerCase();

  return isUuid(
    donationId,
  )
    ? donationId
    : null;
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
    ).replace(
      /\s+/g,
      " ",
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

  const termsConsent =
    formData.get(
      "termsConsent",
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
    donorName.length <
      2 ||
    !/\p{L}/u.test(
      donorName,
    )
  ) {
    return {
      success: false,
      error:
        "Nama donatur harus berisi sedikitnya 2 karakter dan memiliki huruf.",
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

  if (!termsConsent) {
    return {
      success: false,
      error:
        "Anda harus menyetujui Ketentuan Donasi sebelum mengirim formulir.",
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

  const amountFormatValid =
    /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(
      amountRaw,
    );

  if (!amountFormatValid) {
    return {
      success: false,
      error:
        "Format nominal donasi tidak valid.",
    };
  }

  const amount =
    Number(
      amountRaw.replace(
        /\./g,
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
            return null;
          }

          const [
            createdDonation,
          ] =
            await tx
              .insert(
                donations,
              )
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
              })
              .returning({
                id:
                  donations.id,
              });

          return (
            createdDonation
              ?.id ||
            null
          );
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
      reference:
        formatDonationReference(
          inserted,
        ),
    };
  } catch (error) {
    console.error(
      "Submit donation error:",
      error,
    );

    return {
      success: false,
      error:
        "Terjadi gangguan saat memproses formulir. Jangan melakukan transfer ulang. Silakan coba kirim formulir ini kembali beberapa saat lagi; bukti transfer yang sama tidak akan dicatat dua kali.",
    };
  }
}

export async function checkDonationStatus(
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
    `donation-status-${ip}`,
    15,
    10 * 60 * 1000,
  );

  if (!rateLimitSuccess) {
    return {
      success: false,
      error:
        "Terlalu banyak pemeriksaan status. Silakan coba beberapa saat lagi.",
      data: null,
    };
  }

  const reference =
    cleanText(
      formData.get(
        "reference",
      ),
    );

  const donationId =
    parseDonationReference(
      reference,
    );

  if (!donationId) {
    return {
      success: false,
      error:
        "Nomor referensi tidak ditemukan atau tidak valid.",
      data: null,
    };
  }

  try {
    const [
      donation,
    ] =
      await db
        .select({
          id:
            donations.id,
          amount:
            donations.amount,
          status:
            donations.status,
          reviewNote:
            donations.reviewNote,
          reviewedAt:
            donations.reviewedAt,
          createdAt:
            donations.createdAt,
          programName:
            programs.name,
        })
        .from(donations)
        .leftJoin(
          programs,
          eq(
            donations.programId,
            programs.id,
          ),
        )
        .where(
          eq(
            donations.id,
            donationId,
          ),
        )
        .limit(1);

    if (!donation) {
      return {
        success: false,
        error:
          "Nomor referensi tidak ditemukan atau tidak valid.",
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: {
        reference:
          formatDonationReference(
            donation.id,
          ),
        status:
          donation.status,
        amount:
          donation.amount,
        programName:
          donation.programName,
        reviewNote:
          donation.reviewNote,
        reviewedAt:
          donation.reviewedAt
            ?.toISOString() ||
          null,
        createdAt:
          donation.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error(
      "Check donation status error:",
      error,
    );

    return {
      success: false,
      error:
        "Status donasi belum dapat diperiksa. Silakan coba kembali beberapa saat lagi.",
      data: null,
    };
  }
}