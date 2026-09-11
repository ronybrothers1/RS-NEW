import {
  eq,
} from "drizzle-orm";

import {
  sendPasswordResetEmail,
} from "@/lib/email-sender";
import {
  generatePasswordResetOtp,
  getPasswordResetOtpExpiry,
  hashPasswordResetOtp,
} from "@/lib/password-reset";
import {
  db,
} from "@/src/db";
import {
  passwordResetCodes,
} from "@/src/db/schema";

export async function issuePasswordResetCode(
  userId: string,
  email: string,
) {
  const code =
    generatePasswordResetOtp();

  const now =
    new Date();

  const codeHash =
    hashPasswordResetOtp(
      userId,
      code,
    );

  const expiresAt =
    getPasswordResetOtpExpiry();

  await db
    .insert(
      passwordResetCodes,
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
        passwordResetCodes.userId,
      set: {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        updatedAt: now,
      },
    });

  try {
    await sendPasswordResetEmail({
      to: email,
      code,
    });
  } catch (error) {
    await db
      .update(
        passwordResetCodes,
      )
      .set({
        lastSentAt:
          new Date(0),
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          passwordResetCodes.userId,
          userId,
        ),
      );

    throw error;
  }
}