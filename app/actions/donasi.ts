"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  and,
  eq,
} from "drizzle-orm";

import { db } from "@/src/db";
import {
  donations,
  programs,
  settings,
} from "@/src/db/schema";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_PROOF_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);

const SUPPORTED_BANKS = new Set([
  "BCA",
  "MANDIRI",
  "BSI",
  "BRI",
]);

function cleanText(
  value: FormDataEntryValue | null,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function submitDonation(
  _prevState: unknown,
  formData: FormData,
) {
  const headersList = await headers();

  const forwardedFor =
    headersList.get("x-forwarded-for");

  const ip =
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown-ip";

  const {
    success: rateLimitSuccess,
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

  const donorName = cleanText(
    formData.get("donorName"),
  );

  const amountRaw = cleanText(
    formData.get("amount"),
  );

  const programId = cleanText(
    formData.get("programId"),
  );

  const paymentMethod = cleanText(
    formData.get("paymentMethod"),
  ).toUpperCase();

  const isAnonymous =
    formData.get("isAnonymous") === "on";

  const proofEntry =
    formData.get("proofImage");

  if (
    !donorName ||
    !amountRaw ||
    !programId ||
    !paymentMethod
  ) {
    return {
      success: false,
      error:
        "Data donasi belum lengkap.",
    };
  }

  if (donorName.length > 180) {
    return {
      success: false,
      error:
        "Nama maksimal 180 karakter.",
    };
  }

  if (!isUuid(programId)) {
    return {
      success: false,
      error:
        "Program yang dipilih tidak valid.",
    };
  }

  const amount = Number(
    amountRaw.replace(/\D/g, ""),
  );

  if (
    !Number.isSafeInteger(amount) ||
    amount < 10000
  ) {
    return {
      success: false,
      error:
        "Minimal donasi adalah Rp10.000.",
    };
  }

  if (
    !(proofEntry instanceof File) ||
    proofEntry.size === 0
  ) {
    return {
      success: false,
      error:
        "Bukti transfer wajib diunggah.",
    };
  }

  if (
    proofEntry.size >
    5 * 1024 * 1024
  ) {
    return {
      success: false,
      error:
        "Ukuran gambar maksimal 5 MB.",
    };
  }

  if (
    !ALLOWED_PROOF_TYPES.has(
      proofEntry.type,
    )
  ) {
    return {
      success: false,
      error:
        "Bukti transfer harus berformat JPG atau PNG.",
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

  try {
    const settingKey =
      `bank_${paymentMethod.toLowerCase()}`;

    const [
      selectedPrograms,
      bankSettings,
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
          value: settings.value,
        })
        .from(settings)
        .where(
          eq(
            settings.key,
            settingKey,
          ),
        )
        .limit(1),
    ]);

    if (!selectedPrograms[0]) {
      return {
        success: false,
        error:
          "Program tersebut tidak tersedia atau sedang nonaktif.",
      };
    }

    if (
      !bankSettings[0]?.value?.trim()
    ) {
      return {
        success: false,
        error:
          "Metode pembayaran tersebut sedang tidak tersedia.",
      };
    }

    const buffer =
      await proofEntry.arrayBuffer();

    const base64 =
      Buffer.from(buffer).toString(
        "base64",
      );

    const proofImage =
      `data:${proofEntry.type};base64,${base64}`;

    await db
      .insert(donations)
      .values({
        donorName,
        amount: amount.toString(),
        programId,
        paymentMethod,
        isAnonymous,
        proofImage,
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