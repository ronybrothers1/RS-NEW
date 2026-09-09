import {
  eq,
} from "drizzle-orm";

import { db } from "@/src/db";
import {
  emailVerificationCodes,
} from "@/src/db/schema";

import {
  generateEmailOtp,
  getEmailOtpExpiry,
  hashEmailOtp,
} from "@/lib/email-verification";

import {
  sendVerificationEmail,
} from "@/lib/email-sender";

export async function issueEmailVerificationCode(
  userId: string,
  email: string,
) {
  const code =
    generateEmailOtp();

  const now = new Date();

  const codeHash =
    hashEmailOtp(
      userId,
      code,
    );

  const expiresAt =
    getEmailOtpExpiry();

  await db
    .insert(
      emailVerificationCodes,
    )
    .values({
      userId,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target:
        emailVerificationCodes.userId,
      set: {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        updatedAt: now,
      },
    });

  try {
    await sendVerificationEmail({
      to: email,
      code,
    });
  } catch (error) {
    await db
      .update(
        emailVerificationCodes,
      )
      .set({
        lastSentAt:
          new Date(0),
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          emailVerificationCodes.userId,
          userId,
        ),
      );

    throw error;
  }
}

export async function ensureEmailVerificationCode(
  userId: string,
  email: string,
) {
  const [existing] =
    await db
      .select({
        expiresAt:
          emailVerificationCodes.expiresAt,
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

  if (
    existing &&
    existing.expiresAt >
      new Date()
  ) {
    return;
  }

  await issueEmailVerificationCode(
    userId,
    email,
  );
}