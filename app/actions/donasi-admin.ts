"use server";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";
import { db } from "@/src/db";
import {
  auditLogs,
  campaigns,
  donations,
  financialTransactions,
} from "@/src/db/schema";
import {
  and,
  eq,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getAdminSession() {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
    return null;
  }

  return {
    userId: staff.id,
  };
}

function revalidateDonationPages() {
  revalidatePath("/admin/donasi");
  revalidatePath("/admin/dashboard");
  revalidatePath("/donasi");
}

function revalidateVerifiedDonationPages() {
  revalidateDonationPages();
  revalidatePath(
    "/admin/keuangan/masuk",
  );
  revalidatePath(
    "/admin/keuangan/riwayat",
  );
  revalidatePath(
    "/admin/keuangan/kampanye",
  );
  revalidatePath("/transparansi");
  revalidatePath(
    "/bantuan",
  );
}

export async function verifyDonation(
  donationId: string,
  reviewNote = "",
) {
  const session =
    await getAdminSession();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  if (!isUuid(donationId)) {
    return {
      success: false,
      error:
        "ID donasi tidak valid.",
    };
  }

  const normalizedReviewNote =
    reviewNote.trim();

  if (
    normalizedReviewNote.length >
    500
  ) {
    return {
      success: false,
      error:
        "Catatan verifikasi maksimal 500 karakter.",
    };
  }

  const finalReviewNote =
    normalizedReviewNote ||
    "Bukti transfer telah diverifikasi oleh pengurus.";

  try {
    const result =
      await db.transaction(
        async (tx) => {
          const [oldDonation] =
            await tx
              .select()
              .from(donations)
              .where(
                eq(
                  donations.id,
                  donationId,
                ),
              )
              .limit(1);

          if (!oldDonation) {
            return {
              success: false as const,
              error:
                "Donasi tidak ditemukan.",
            };
          }

          if (
            oldDonation.status ===
            "SUCCESS"
          ) {
            const [linkedTransaction] =
              await tx
                .select({
                  id: financialTransactions.id,
                })
                .from(
                  financialTransactions,
                )
                .where(
                  eq(
                    financialTransactions.donationId,
                    donationId,
                  ),
                )
                .limit(1);

            if (linkedTransaction) {
              return {
                success: true as const,
                error: null,
              };
            }

            return {
              success: false as const,
              error:
                "Donasi ini sudah berstatus berhasil, tetapi merupakan data lama yang belum memiliki tautan transaksi. Jangan verifikasi ulang.",
            };
          }

          if (
            oldDonation.status !==
            "PENDING"
          ) {
            return {
              success: false as const,
              error:
                "Donasi sudah diproses sebelumnya.",
            };
          }

          if (
            !oldDonation.proofImage
              ?.trim()
          ) {
            return {
              success: false as const,
              error:
                "Donasi tidak memiliki bukti transfer dan tidak dapat diverifikasi.",
            };
          }

          if (
            oldDonation.campaignId
          ) {
            const [campaign] =
              await tx
                .select({
                  status:
                    campaigns.status,
                })
                .from(campaigns)
                .where(
                  eq(
                    campaigns.id,
                    oldDonation.campaignId,
                  ),
                )
                .limit(1);

            if (
              !campaign ||
              campaign.status ===
                "CANCELLED"
            ) {
              return {
                success:
                  false as const,
                error:
                  "Donasi kampanye tidak dapat diverifikasi karena kampanye telah dibatalkan atau tidak tersedia.",
              };
            }
          }

          const donationAmount =
            Number(
              oldDonation.amount,
            );

          if (
            !Number.isFinite(
              donationAmount,
            ) ||
            donationAmount <= 0
          ) {
            return {
              success: false as const,
              error:
                "Nominal donasi tidak valid dan tidak dapat dicatat ke keuangan.",
            };
          }
          const [updatedDonation] =
            await tx
              .update(donations)
              .set({
                status: "SUCCESS",
                reviewNote:
                  finalReviewNote,
                reviewedAt:
                  new Date(),
                reviewedBy:
                  session.userId,
              })
              .where(
                and(
                  eq(
                    donations.id,
                    donationId,
                  ),
                  eq(
                    donations.status,
                    "PENDING",
                  ),
                ),
              )
              .returning();

          if (!updatedDonation) {
            return {
              success: false as const,
              error:
                "Donasi sedang atau sudah diproses. Muat ulang halaman.",
            };
          }

          const [newTransaction] =
            await tx
              .insert(
                financialTransactions,
              )
              .values({
                type: "IN",
                amount:
                  updatedDonation.amount,
                date: new Date(),
                description: `Donasi via Website - ${
                  updatedDonation.paymentMethod ||
                  "Transfer"
                }`,
                programId:
                  updatedDonation.programId,
                campaignId:
                  updatedDonation.campaignId,
                donationId:
                  updatedDonation.id,
                userId: session.userId,
                donorName:
                  updatedDonation.donorName,
                isAnonymous:
                  updatedDonation.isAnonymous,
                updatedAt: new Date(),
              })
              .returning();

          await tx
            .insert(auditLogs)
            .values({
              userId: session.userId,
              action:
                "VERIFY_DONATION",
              tableName: "donations",
              recordId:
                updatedDonation.id,
              oldData: oldDonation,
              newData: {
                donation:
                  updatedDonation,
                transactionId:
                  newTransaction.id,
              },
            });

          return {
            success: true as const,
            error: null,
          };
        },
      );

    if (result.success) {
      revalidateVerifiedDonationPages();
    }

    return result;
  } catch (error) {
    console.error(
      "Verify donation error:",
      error,
    );

    return {
      success: false,
      error:
        "Gagal memverifikasi donasi.",
    };
  }
}

export async function rejectDonation(
  donationId: string,
  reviewNote: string,
) {
  const session =
    await getAdminSession();

  if (!session) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  if (!isUuid(donationId)) {
    return {
      success: false,
      error:
        "ID donasi tidak valid.",
    };
  }

  const normalizedReviewNote =
    reviewNote.trim();

  if (
    normalizedReviewNote.length <
    10
  ) {
    return {
      success: false,
      error:
        "Alasan penolakan wajib diisi minimal 10 karakter.",
    };
  }

  if (
    normalizedReviewNote.length >
    500
  ) {
    return {
      success: false,
      error:
        "Alasan penolakan maksimal 500 karakter.",
    };
  }

  try {
    const result =
      await db.transaction(
        async (tx) => {
          const [oldDonation] =
            await tx
              .select()
              .from(donations)
              .where(
                eq(
                  donations.id,
                  donationId,
                ),
              )
              .limit(1);

          if (!oldDonation) {
            return {
              success: false as const,
              error:
                "Donasi tidak ditemukan.",
            };
          }

          if (
            oldDonation.status !==
            "PENDING"
          ) {
            return {
              success: false as const,
              error:
                "Donasi sudah diproses sebelumnya.",
            };
          }

          const [updatedDonation] =
            await tx
              .update(donations)
              .set({
                status: "FAILED",
                reviewNote:
                  normalizedReviewNote,
                reviewedAt:
                  new Date(),
                reviewedBy:
                  session.userId,
              })
              .where(
                and(
                  eq(
                    donations.id,
                    donationId,
                  ),
                  eq(
                    donations.status,
                    "PENDING",
                  ),
                ),
              )
              .returning();

          if (!updatedDonation) {
            return {
              success: false as const,
              error:
                "Donasi sedang atau sudah diproses. Muat ulang halaman.",
            };
          }

          await tx
            .insert(auditLogs)
            .values({
              userId: session.userId,
              action:
                "REJECT_DONATION",
              tableName: "donations",
              recordId: donationId,
              oldData: oldDonation,
              newData:
                updatedDonation,
            });

          return {
            success: true as const,
            error: null,
          };
        },
      );

    if (result.success) {
      revalidateDonationPages();
    }

    return result;
  } catch (error) {
    console.error(
      "Reject donation error:",
      error,
    );

    return {
      success: false,
      error:
        "Gagal menolak donasi.",
    };
  }
}