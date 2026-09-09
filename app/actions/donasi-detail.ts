"use server";

import { auth } from "@/auth";
import { db } from "@/src/db";
import {
  donations,
  financialTransactions,
  programs,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getDonationSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const role = (
    session.user as {
      role?: string;
    }
  ).role;

  if (
    role !== "ADMIN" &&
    role !== "OPERATOR"
  ) {
    return null;
  }

  return session;
}

export async function getDonationDetail(
  donationId: string,
) {
  const session =
    await getDonationSession();

  if (!session) {
    return {
      success: false as const,
      error:
        "Anda tidak memiliki akses.",
      data: null,
    };
  }

  if (!isUuid(donationId)) {
    return {
      success: false as const,
      error:
        "ID donasi tidak valid.",
      data: null,
    };
  }

  try {
    const [donation] = await db
      .select({
        id: donations.id,
        donorName:
          donations.donorName,
        amount: donations.amount,
        programId:
          donations.programId,
        programName:
          programs.name,
        status: donations.status,
        paymentMethod:
          donations.paymentMethod,
        proofImage:
          donations.proofImage,
        isAnonymous:
          donations.isAnonymous,
        createdAt:
          donations.createdAt,
        linkedTransactionId:
          financialTransactions.id,
      })
      .from(donations)
      .leftJoin(
        programs,
        eq(
          donations.programId,
          programs.id,
        ),
      )
      .leftJoin(
        financialTransactions,
        eq(
          financialTransactions.donationId,
          donations.id,
        ),
      )
      .where(
        eq(
          donations.id,
          donationId,
        ),
      )
      .limit(1);

    if (!donation) {
      return {
        success: false as const,
        error:
          "Donasi tidak ditemukan.",
        data: null,
      };
    }

    return {
      success: true as const,
      error: null,
      data: {
        ...donation,
        createdAt:
          donation.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error(
      "Get donation detail error:",
      error,
    );

    return {
      success: false as const,
      error:
        "Gagal memuat detail donasi.",
      data: null,
    };
  }
}