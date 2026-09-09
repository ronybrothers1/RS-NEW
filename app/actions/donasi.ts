"use server";

import {
  and,
  eq,
} from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/src/db";
import {
  donations,
  programs,
  settings,
} from "@/src/db/schema";

const MAX_PROOF_SIZE =
  5 * 1024 * 1024;

const ALLOWED_PROOF_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
  ]);

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

function isAllowedProofUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "https:" &&
      url.hostname.endsWith(
        ".blob.vercel-storage.com",
      ) &&
      url.pathname.startsWith(
        "/media/donasi/",
      )
    );
  } catch {
    return false;
  }
}

async function validateProofUpload(
  proofImageUrl: string,
): Promise<ProofValidationResult> {
  if (
    !isAllowedProofUrl(
      proofImageUrl,
    )
  ) {
    return {
      success: false,
      error:
        "Bukti transfer tidak valid. Silakan unggah ulang.",
    };
  }

  try {
    const response =
      await fetch(
        proofImageUrl,
        {
          method: "HEAD",
          cache: "no-store",
        },
      );

    if (!response.ok) {
      return {
        success: false,
        error:
          "Bukti transfer tidak dapat ditemukan. Silakan unggah ulang.",
      };
    }

    const contentType =
      (
        response.headers.get(
          "content-type",
        ) || ""
      )
        .split(";")[0]
        .trim()
        .toLowerCase();

    if (
      !ALLOWED_PROOF_TYPES.has(
        contentType,
      )
    ) {
      return {
        success: false,
        error:
          "Format bukti transfer tidak valid.",
      };
    }

    const contentLengthRaw =
      response.headers.get(
        "content-length",
      );

    if (contentLengthRaw) {
      const contentLength =
        Number(
          contentLengthRaw,
        );

      if (
        Number.isFinite(
          contentLength,
        ) &&
        contentLength >
          MAX_PROOF_SIZE
      ) {
        return {
          success: false,
          error:
            "Ukuran bukti transfer melebihi 5 MB.",
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Proof validation error:",
      error,
    );

    return {
      success: false,
      error:
        "Bukti transfer tidak dapat diverifikasi. Silakan unggah ulang.",
    };
  }
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
    await validateProofUpload(
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

    await db
      .insert(donations)
      .values({
        donorName,
        amount:
          amount.toString(),
        programId,
        paymentMethod,
        isAnonymous,
        proofImage:
          proofImageUrl,
        status: "PENDING",
      });

    revalidatePath(
      "/admin/donasi",
    );

    revalidatePath(
      "/admin/dashboard",
    );

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