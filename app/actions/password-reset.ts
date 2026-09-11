"use server";

import {
  hash,
} from "bcryptjs";
import {
  eq,
  ilike,
} from "drizzle-orm";
import {
  headers,
} from "next/headers";

import {
  issuePasswordResetCode,
} from "@/lib/issue-password-reset";
import {
  verifyPasswordResetOtpHash,
} from "@/lib/password-reset";
import {
  clearPendingPasswordResetCookie,
  getPendingPasswordResetEmail,
  setPendingPasswordResetCookie,
} from "@/lib/password-reset-session";
import {
  rateLimit,
} from "@/lib/rate-limit";
import {
  db,
} from "@/src/db";
import {
  auditLogs,
  passwordResetCodes,
  users,
} from "@/src/db/schema";

export type RequestPasswordResetState = {
  success: boolean;
  error: string | null;
  retryAfter: number;
};

export type CompletePasswordResetState = {
  success: boolean;
  error: string | null;
};

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

function normalizeEmail(
  value: FormDataEntryValue | null,
) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase();
}

function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

export async function requestPasswordReset(
  _prevState:
    RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const email =
    normalizeEmail(
      formData.get("email"),
    );

  if (!isValidEmail(email)) {
    return {
      success: false,
      error:
        "Masukkan alamat email yang valid.",
      retryAfter: 0,
    };
  }

  const headersList =
    await headers();

  const ip =
    getIp(headersList);

  const {
    success: allowed,
    retryAfterMs,
  } = rateLimit(
    `password-reset-request:${ip}:${email}`,
    5,
    15 * 60 * 1000,
  );

  if (!allowed) {
    return {
      success: false,
      error:
        `Terlalu banyak permintaan. Coba lagi sekitar ${Math.max(
          1,
          Math.ceil(
            retryAfterMs /
              60000,
          ),
        )} menit lagi.`,
      retryAfter: 0,
    };
  }

  await setPendingPasswordResetCookie(
    email,
  );

  const [user] =
    await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(
        ilike(
          users.email,
          email,
        ),
      )
      .limit(1);

  if (user) {
    try {
      await issuePasswordResetCode(
        user.id,
        user.email,
      );
    } catch (error) {
      console.error(
        "Initial password reset email failed:",
        error,
      );
    }
  }

  return {
    success: true,
    error: null,
    retryAfter: 60,
  };
}

export async function resendPasswordResetCode(
  _prevState:
    RequestPasswordResetState,
): Promise<RequestPasswordResetState> {
  const email =
    await getPendingPasswordResetEmail();

  if (!email) {
    return {
      success: false,
      error:
        "Sesi pemulihan telah berakhir. Silakan mulai kembali.",
      retryAfter: 0,
    };
  }

  const headersList =
    await headers();

  const ip =
    getIp(headersList);

  const {
    success: allowed,
    retryAfterMs,
  } = rateLimit(
    `password-reset-resend:${ip}:${email}`,
    5,
    15 * 60 * 1000,
  );

  if (!allowed) {
    return {
      success: false,
      error:
        `Terlalu banyak permintaan. Coba lagi sekitar ${Math.max(
          1,
          Math.ceil(
            retryAfterMs /
              60000,
          ),
        )} menit lagi.`,
      retryAfter: 0,
    };
  }

  const [user] =
    await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(
        ilike(
          users.email,
          email,
        ),
      )
      .limit(1);

  if (!user) {
    return {
      success: true,
      error: null,
      retryAfter: 60,
    };
  }

  const [existing] =
    await db
      .select({
        lastSentAt:
          passwordResetCodes.lastSentAt,
      })
      .from(
        passwordResetCodes,
      )
      .where(
        eq(
          passwordResetCodes.userId,
          user.id,
        ),
      )
      .limit(1);

  if (existing) {
    const elapsed =
      Date.now() -
      existing.lastSentAt.getTime();

    if (elapsed < 60_000) {
      return {
        success: true,
        error: null,
        retryAfter:
          Math.max(
            1,
            Math.ceil(
              (60_000 -
                elapsed) /
                1000,
            ),
          ),
      };
    }
  }

  try {
    await issuePasswordResetCode(
      user.id,
      user.email,
    );
  } catch (error) {
    console.error(
      "Resend password reset email failed:",
      error,
    );
  }

  return {
    success: true,
    error: null,
    retryAfter: 60,
  };
}

export async function completePasswordReset(
  _prevState:
    CompletePasswordResetState,
  formData: FormData,
): Promise<CompletePasswordResetState> {
  const email =
    await getPendingPasswordResetEmail();

  if (!email) {
    return {
      success: false,
      error:
        "Sesi pemulihan telah berakhir. Silakan mulai kembali.",
    };
  }

  const code =
    String(
      formData.get("code") ||
        "",
    ).replace(/\D/g, "");

  const password =
    String(
      formData.get("password") ||
        "",
    );

  const confirmPassword =
    String(
      formData.get(
        "confirmPassword",
      ) || "",
    );

  if (
    !/^\d{6}$/.test(code)
  ) {
    return {
      success: false,
      error:
        "Masukkan kode pemulihan 6 digit.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error:
        "Password minimal 8 karakter.",
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
    };
  }

  const headersList =
    await headers();

  const ip =
    getIp(headersList);

  const {
    success: allowed,
    retryAfterMs,
  } = rateLimit(
    `password-reset-verify:${ip}:${email}`,
    10,
    15 * 60 * 1000,
  );

  if (!allowed) {
    return {
      success: false,
      error:
        `Terlalu banyak percobaan. Coba lagi sekitar ${Math.max(
          1,
          Math.ceil(
            retryAfterMs /
              60000,
          ),
        )} menit lagi.`,
    };
  }

  const [user] =
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

  if (!user) {
    return {
      success: false,
      error:
        "Kode tidak valid atau sudah kedaluwarsa. Silakan minta kode baru.",
    };
  }

  const [reset] =
    await db
      .select()
      .from(
        passwordResetCodes,
      )
      .where(
        eq(
          passwordResetCodes.userId,
          user.id,
        ),
      )
      .limit(1);

  if (
    !reset ||
    reset.expiresAt <
      new Date()
  ) {
    return {
      success: false,
      error:
        "Kode tidak valid atau sudah kedaluwarsa. Silakan minta kode baru.",
    };
  }

  if (
    reset.attempts >= 5
  ) {
    return {
      success: false,
      error:
        "Batas percobaan tercapai. Silakan kirim kode baru.",
    };
  }

  const valid =
    verifyPasswordResetOtpHash(
      user.id,
      code,
      reset.codeHash,
    );

  if (!valid) {
    const attempts =
      reset.attempts + 1;

    await db
      .update(
        passwordResetCodes,
      )
      .set({
        attempts,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          passwordResetCodes.userId,
          user.id,
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
    };
  }

  const passwordHash =
    await hash(
      password,
      12,
    );

  await db.transaction(
    async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash,
        })
        .where(
          eq(
            users.id,
            user.id,
          ),
        );

      await tx
        .delete(
          passwordResetCodes,
        )
        .where(
          eq(
            passwordResetCodes.userId,
            user.id,
          ),
        );

      await tx
        .insert(auditLogs)
        .values({
          userId:
            user.id,
          action:
            "RESET_PASSWORD",
          tableName:
            "users",
          recordId:
            user.id,
          newData: {
            method:
              "EMAIL_OTP",
          },
        });
    },
  );

  await clearPendingPasswordResetCookie();

  return {
    success: true,
    error: null,
  };
}