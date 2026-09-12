"use server";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";
import { db } from "@/src/db";
import {
  donations,
  financialTransactions,
  programs,
  users,
} from "@/src/db/schema";
import { eq } from "drizzle-orm";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function getDonationDetail(
  donationId: string,
) {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
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
        reviewNote:
          donations.reviewNote,
        reviewedAt:
          donations.reviewedAt,
        reviewerName:
          users.name,
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
      .leftJoin(
        users,
        eq(
          donations.reviewedBy,
          users.id,
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
        proofImage:
          donation.proofImage
            ? `/api/admin/donasi/${donation.id}/proof`
            : null,
        createdAt:
          donation.createdAt.toISOString(),
        reviewedAt:
          donation.reviewedAt
            ?.toISOString() ||
          null,
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