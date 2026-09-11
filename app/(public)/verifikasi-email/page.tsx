import {
  redirect,
} from "next/navigation";

import {
  eq,
  sql,
} from "drizzle-orm";

import { db } from "@/src/db";

import {
  emailVerificationCodes,
  users,
} from "@/src/db/schema";

import {
  getEmailVerificationUserId,
} from "@/lib/email-verification-session";

import EmailVerificationForm from "./components/EmailVerificationForm";

export const dynamic =
  "force-dynamic";

function maskEmail(
  email: string,
) {
  const [
    local,
    domain,
  ] = email.split("@");

  if (
    !local ||
    !domain
  ) {
    return email;
  }

  const visible =
    local.slice(0, 2);

  return `${visible}${"*".repeat(
    Math.max(
      2,
      local.length - 2,
    ),
  )}@${domain}`;
}

export default async function VerifyEmailPage() {
  const userId =
    await getEmailVerificationUserId();

  if (!userId) {
    redirect("/login");
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
    redirect("/");
  }

  if (user.emailVerifiedAt) {
    redirect("/akun");
  }

  const [verification] =
    await db
      .select({
        lastSentAt:
          emailVerificationCodes.lastSentAt,
        currentTime:
          sql<string | Date>`CURRENT_TIMESTAMP`,
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

  const initialDeliveryFailed =
    !verification ||
    verification.lastSentAt.getTime() <=
      0;

  let countdown = 0;

  if (verification) {
    const currentTimeMs =
      verification.currentTime instanceof Date
        ? verification.currentTime.getTime()
        : new Date(
            verification.currentTime,
          ).getTime();

    const lastSentAtMs =
      verification.lastSentAt.getTime();

    if (
      Number.isFinite(
        currentTimeMs,
      ) &&
      Number.isFinite(
        lastSentAtMs,
      )
    ) {
      const elapsed =
        currentTimeMs -
        lastSentAtMs;

      countdown =
        Math.max(
          0,
          Math.ceil(
            (60_000 -
              elapsed) /
              1000,
          ),
        );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <EmailVerificationForm
          maskedEmail={maskEmail(
            user.email,
          )}
          initialCountdown={
            countdown
          }
          initialDeliveryFailed={
            initialDeliveryFailed
          }
        />
      </div>
    </div>
  );
}