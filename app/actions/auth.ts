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
  signIn,
} from "@/auth";

import { db } from "@/src/db";

import {
  users,
} from "@/src/db/schema";

import {
  ensureEmailVerificationCode,
} from "@/lib/issue-email-verification";

import {
  setPendingEmailVerificationCookie,
} from "@/lib/email-verification-session";

export type LoginState = {
  success: boolean;
  error: string | null;
  requiresVerification: boolean;
};

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