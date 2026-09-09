"use server";

import {
  eq,
} from "drizzle-orm";

import {
  signIn,
} from "@/auth";

import { db } from "@/src/db";

import {
  auditLogs,
  emailVerificationCodes,
  users,
} from "@/src/db/schema";

import {
  createEmailVerificationLoginToken,
  verifyEmailOtpHash,
} from "@/lib/email-verification";

import {
  clearPendingEmailVerificationCookie,
  getEmailVerificationUserId,
} from "@/lib/email-verification-session";

import {
  issueEmailVerificationCode,
} from "@/lib/issue-email-verification";

export type VerifyEmailState = {
  success: boolean;
  error: string | null;
  autoLogin: boolean;
};

export type ResendEmailState = {
  success: boolean;
  error: string | null;
  retryAfter: number;
};

export async function verifyEmailCode(
  _prevState: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const userId =
    await getEmailVerificationUserId();

  if (!userId) {
    return {
      success: false,
      error:
        "Sesi verifikasi tidak ditemukan. Silakan masuk kembali.",
      autoLogin: false,
    };
  }

  const code = String(
    formData.get("code") || "",
  ).replace(/\D/g, "");

  if (
    !/^\d{6}$/.test(code)
  ) {
    return {
      success: false,
      error:
        "Masukkan kode verifikasi 6 digit.",
      autoLogin: false,
    };
  }

  const [user] =
    await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        emailVerifiedAt:
          users.emailVerifiedAt,
      })
      .from(users)
      .where(
        eq(
          users.id,
          userId,
        ),
      )
      .limit(1);

  if (
    !user ||
    user.role !== "USER"
  ) {
    return {
      success: false,
      error:
        "Akun tidak ditemukan.",
      autoLogin: false,
    };
  }

  if (user.emailVerifiedAt) {
    await clearPendingEmailVerificationCookie();

    return {
      success: true,
      error: null,
      autoLogin: false,
    };
  }

  const [verification] =
    await db
      .select()
      .from(
        emailVerificationCodes,
      )
      .where(
        eq(
          emailVerificationCodes.userId,
          userId,
        ),
      )
      .limit(1);

  if (!verification) {
    return {
      success: false,
      error:
        "Kode belum tersedia. Silakan kirim ulang kode.",
      autoLogin: false,
    };
  }

  if (
    verification.expiresAt <
    new Date()
  ) {
    return {
      success: false,
      error:
        "Kode sudah kedaluwarsa. Silakan kirim kode baru.",
      autoLogin: false,
    };
  }

  if (
    verification.attempts >=
    5
  ) {
    return {
      success: false,
      error:
        "Batas percobaan tercapai. Silakan kirim kode baru.",
      autoLogin: false,
    };
  }

  const valid =
    verifyEmailOtpHash(
      userId,
      code,
      verification.codeHash,
    );

  if (!valid) {
    const attempts =
      verification.attempts +
      1;

    await db
      .update(
        emailVerificationCodes,
      )
      .set({
        attempts,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          emailVerificationCodes.userId,
          userId,
        ),
      );

    const remaining =
      Math.max(
        0,
        5 - attempts,
      );

    return {
      success: false,
      error:
        remaining > 0
          ? `Kode tidak sesuai. Tersisa ${remaining} percobaan.`
          : "Kode tidak sesuai. Silakan kirim kode baru.",
      autoLogin: false,
    };
  }

  const verifiedAt =
    new Date();

  await db.transaction(
    async (tx) => {
      await tx
        .update(users)
        .set({
          emailVerifiedAt:
            verifiedAt,
        })
        .where(
          eq(
            users.id,
            userId,
          ),
        );

      await tx
        .delete(
          emailVerificationCodes,
        )
        .where(
          eq(
            emailVerificationCodes.userId,
            userId,
          ),
        );

      await tx
        .insert(auditLogs)
        .values({
          userId,
          action:
            "VERIFY_EMAIL",
          tableName: "users",
          recordId: userId,
          newData: {
            emailVerifiedAt:
              verifiedAt.toISOString(),
          },
        });
    },
  );

  await clearPendingEmailVerificationCookie();

  try {
    const token =
      createEmailVerificationLoginToken(
        userId,
      );

    await signIn(
      "verified-email",
      {
        token,
        redirect: false,
      },
    );

    return {
      success: true,
      error: null,
      autoLogin: true,
    };
  } catch (error) {
    console.error(
      "Auto-login after email verification failed:",
      error,
    );

    return {
      success: true,
      error: null,
      autoLogin: false,
    };
  }
}

export async function resendEmailCode(
  _prevState: ResendEmailState,
): Promise<ResendEmailState> {
  const userId =
    await getEmailVerificationUserId();

  if (!userId) {
    return {
      success: false,
      error:
        "Sesi verifikasi tidak ditemukan.",
      retryAfter: 0,
    };
  }

  const [user] =
    await db
      .select({
        email: users.email,
        role: users.role,
        emailVerifiedAt:
          users.emailVerifiedAt,
      })
      .from(users)
      .where(
        eq(
          users.id,
          userId,
        ),
      )
      .limit(1);

  if (
    !user ||
    user.role !== "USER"
  ) {
    return {
      success: false,
      error:
        "Akun tidak ditemukan.",
      retryAfter: 0,
    };
  }

  if (user.emailVerifiedAt) {
    return {
      success: false,
      error:
        "Email sudah terverifikasi.",
      retryAfter: 0,
    };
  }

  const [existing] =
    await db
      .select({
        lastSentAt:
          emailVerificationCodes.lastSentAt,
      })
      .from(
        emailVerificationCodes,
      )
      .where(
        eq(
          emailVerificationCodes.userId,
          userId,
        ),
      )
      .limit(1);

  if (existing) {
    const elapsed =
      Date.now() -
      existing.lastSentAt.getTime();

    const cooldown =
      60_000;

    if (
      elapsed < cooldown
    ) {
      const retryAfter =
        Math.ceil(
          (cooldown -
            elapsed) /
            1000,
        );

      return {
        success: false,
        error:
          `Tunggu ${retryAfter} detik sebelum mengirim ulang.`,
        retryAfter,
      };
    }
  }

  try {
    await issueEmailVerificationCode(
      userId,
      user.email,
    );

    return {
      success: true,
      error: null,
      retryAfter: 60,
    };
  } catch (error) {
    console.error(
      "Resend verification email failed:",
      error,
    );

    return {
      success: false,
      error:
        "Kode belum dapat dikirim. Silakan coba kembali.",
      retryAfter: 0,
    };
  }
}