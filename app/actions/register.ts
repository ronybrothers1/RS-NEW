"use server";

import {
  hash,
} from "bcryptjs";
import {
  ilike,
} from "drizzle-orm";
import {
  revalidatePath,
} from "next/cache";
import {
  headers,
} from "next/headers";

import {
  setPendingEmailVerificationCookie,
} from "@/lib/email-verification-session";
import {
  issueEmailVerificationCode,
} from "@/lib/issue-email-verification";
import {
  rateLimit,
} from "@/lib/rate-limit";
import {
  db,
} from "@/src/db";
import {
  auditLogs,
  users,
} from "@/src/db/schema";

export type RegisterState = {
  success: boolean;
  error: string | null;
  verificationRequired: boolean;
  emailSent: boolean;
};

function normalizePhone(
  value: string,
) {
  const digits =
    value.replace(/\D/g, "");

  if (
    digits.startsWith("62")
  ) {
    return `+${digits}`;
  }

  if (
    digits.startsWith("0")
  ) {
    return `+62${digits.slice(
      1,
    )}`;
  }

  return `+62${digits}`;
}

function getIp(
  headersList:
    Awaited<
      ReturnType<
        typeof headers
      >
    >,
) {
  return (
    headersList
      .get(
        "x-forwarded-for",
      )
      ?.split(",")[0]
      ?.trim() ||
    headersList.get(
      "x-real-ip",
    ) ||
    "unknown-ip"
  );
}

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const headersList =
    await headers();

  const ip =
    getIp(headersList);

  const {
    success:
      registrationAllowed,
    retryAfterMs,
  } = rateLimit(
    `register:${ip}`,
    5,
    15 * 60 * 1000,
  );

  if (
    !registrationAllowed
  ) {
    return {
      success: false,
      error:
        `Terlalu banyak percobaan pendaftaran. Coba lagi sekitar ${Math.max(
          1,
          Math.ceil(
            retryAfterMs /
              60000,
          ),
        )} menit lagi.`,
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  const name = String(
    formData.get("name") ||
      "",
  )
    .trim()
    .replace(/\s+/g, " ");

  const email = String(
    formData.get("email") ||
      "",
  )
    .trim()
    .toLowerCase();

  const rawPhone = String(
    formData.get("phone") || "",
  ).trim();

  const password = String(
    formData.get("password") ||
      "",
  );

  const confirmPassword = String(
    formData.get(
      "confirmPassword",
    ) || "",
  );

  const acceptedTerms =
    formData.get("terms") ===
    "on";

  if (
    name.length < 3 ||
    name.length > 120
  ) {
    return {
      success: false,
      error:
        "Nama lengkap harus terdiri dari 3–120 karakter.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    return {
      success: false,
      error:
        "Alamat email tidak valid.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  const phoneDigits =
    rawPhone.replace(
      /\D/g,
      "",
    );

  if (
    phoneDigits.length < 9 ||
    phoneDigits.length > 15
  ) {
    return {
      success: false,
      error:
        "Nomor WhatsApp tidak valid.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  if (
    password.length < 8
  ) {
    return {
      success: false,
      error:
        "Password minimal 8 karakter.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  if (
    password !==
    confirmPassword
  ) {
    return {
      success: false,
      error:
        "Konfirmasi password tidak sama.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  if (!acceptedTerms) {
    return {
      success: false,
      error:
        "Anda harus menyetujui ketentuan penggunaan.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  const existing =
    await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        ilike(
          users.email,
          email,
        ),
      )
      .limit(1);

  if (
    existing.length > 0
  ) {
    return {
      success: false,
      error:
        "Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }

  const passwordHash =
    await hash(
      password,
      12,
    );

  const phone =
    normalizePhone(
      rawPhone,
    );

  try {
    const newUser =
      await db.transaction(
        async (tx) => {
          const [created] =
            await tx
              .insert(users)
              .values({
                name,
                email,
                phone,
                passwordHash,
                role: "USER",
                emailVerifiedAt:
                  null,
              })
              .returning({
                id: users.id,
                email:
                  users.email,
                role:
                  users.role,
              });

          await tx
            .insert(auditLogs)
            .values({
              userId:
                created.id,
              action:
                "REGISTER",
              tableName:
                "users",
              recordId:
                created.id,
              newData: {
                email:
                  created.email,
                role:
                  created.role,
              },
            });

          return created;
        },
      );

    await setPendingEmailVerificationCookie(
      newUser.id,
    );

    let emailSent = true;

    try {
      await issueEmailVerificationCode(
        newUser.id,
        newUser.email,
      );
    } catch (error) {
      emailSent = false;

      console.error(
        "Initial verification email failed:",
        error,
      );
    }

    revalidatePath(
      "/admin/pengguna",
    );

    return {
      success: true,
      error: null,
      verificationRequired: true,
      emailSent,
    };
  } catch (error) {
    console.error(
      "Register user error:",
      error,
    );

    return {
      success: false,
      error:
        "Pendaftaran gagal. Silakan coba kembali.",
      verificationRequired:
        false,
      emailSent: false,
    };
  }
}
