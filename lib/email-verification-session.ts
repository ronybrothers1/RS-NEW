import {
  cookies,
} from "next/headers";

import {
  getCurrentDbUser,
} from "@/lib/current-authz";

import {
  createPendingEmailVerificationToken,
  verifyPendingEmailVerificationToken,
} from "@/lib/email-verification";

export const EMAIL_VERIFICATION_COOKIE =
  "rs_pending_email_verification";

export async function setPendingEmailVerificationCookie(
  userId: string,
) {
  const cookieStore =
    await cookies();

  cookieStore.set(
    EMAIL_VERIFICATION_COOKIE,
    createPendingEmailVerificationToken(
      userId,
    ),
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge:
        24 * 60 * 60,
    },
  );
}

export async function clearPendingEmailVerificationCookie() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    EMAIL_VERIFICATION_COOKIE,
  );
}

export async function getEmailVerificationUserId() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      EMAIL_VERIFICATION_COOKIE,
    )?.value;

  if (token) {
    const userId =
      verifyPendingEmailVerificationToken(
        token,
      );

    if (userId) {
      return userId;
    }
  }

  // Mendukung USER yang sudah login
  // sebelum fitur verifikasi email
  // ditambahkan.
  const currentUser =
    await getCurrentDbUser();

  if (
    currentUser?.role ===
    "USER"
  ) {
    return currentUser.id;
  }

  return null;
}