import {
  cookies,
} from "next/headers";

import {
  createPendingPasswordResetToken,
  verifyPendingPasswordResetToken,
} from "@/lib/password-reset";

export const PASSWORD_RESET_COOKIE =
  "rs_pending_password_reset";

export async function setPendingPasswordResetCookie(
  email: string,
) {
  const cookieStore =
    await cookies();

  cookieStore.set(
    PASSWORD_RESET_COOKIE,
    createPendingPasswordResetToken(
      email,
    ),
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge:
        30 * 60,
    },
  );
}

export async function clearPendingPasswordResetCookie() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    PASSWORD_RESET_COOKIE,
  );
}

export async function getPendingPasswordResetEmail() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      PASSWORD_RESET_COOKIE,
    )?.value;

  if (!token) {
    return null;
  }

  return verifyPendingPasswordResetToken(
    token,
  );
}