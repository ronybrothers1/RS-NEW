"use server";

import {
  compare,
} from "bcryptjs";
import {
  ilike,
} from "drizzle-orm";
import {
  AuthError,
} from "next-auth";
import {
  headers,
} from "next/headers";

import {
  signIn,
} from "@/auth";
import {
  setPendingEmailVerificationCookie,
} from "@/lib/email-verification-session";
import {
  ensureEmailVerificationCode,
} from "@/lib/issue-email-verification";
import {
  rateLimit,
} from "@/lib/rate-limit";
import {
  db,
} from "@/src/db";
import {
  users,
} from "@/src/db/schema";

export type LoginState = {
  success: boolean;
  error: string | null;
  requiresVerification: boolean;
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

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(
    formData.get("email") ||
      "",
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ||
      "",
  );

  if (!email || !password) {
    return {
      success: false,
      error:
        "Email dan password wajib diisi.",
      requiresVerification:
        false,
    };
  }

  const headersList =
    await headers();

  const ip =
    getIp(headersList);

  const {
    success:
      loginAllowed,
    retryAfterMs,
  } = rateLimit(
    `login:${ip}:${email}`,
    10,
    15 * 60 * 1000,
  );

  if (!loginAllowed) {
    return {
      success: false,
      error:
        `Terlalu banyak percobaan masuk. Coba lagi sekitar ${Math.max(
          1,
          Math.ceil(
            retryAfterMs /
              60000,
          ),
        )} menit lagi.`,
      requiresVerification:
        false,
    };
  }

  const [candidate] =
    await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        passwordHash:
          users.passwordHash,
        emailVerifiedAt:
          users.emailVerifiedAt,
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
    candidate?.role ===
      "USER" &&
    !candidate.emailVerifiedAt
  ) {
    const valid =
      await compare(
        password,
        candidate.passwordHash,
      );

    if (!valid) {
      return {
        success: false,
        error:
          "Email atau password salah.",
        requiresVerification:
          false,
      };
    }

    await setPendingEmailVerificationCookie(
      candidate.id,
    );

    try {
      await ensureEmailVerificationCode(
        candidate.id,
        candidate.email,
      );
    } catch (error) {
      console.error(
        "Verification email on login failed:",
        error,
      );
    }

    return {
      success: false,
      error: null,
      requiresVerification:
        true,
    };
  }

  try {
    await signIn(
      "credentials",
      {
        email,
        password,
        redirect: false,
      },
    );

    return {
      success: true,
      error: null,
      requiresVerification:
        false,
    };
  } catch (error) {
    if (
      error instanceof
      AuthError
    ) {
      return {
        success: false,
        error:
          "Email atau password salah.",
        requiresVerification:
          false,
      };
    }

    throw error;
  }
}
