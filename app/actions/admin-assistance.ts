"use server";

import {
  and,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";
import {
  after,
} from "next/server";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";
import {
  notificationsEnabled,
} from "@/lib/notifications/config.server";
import {
  createUserNotificationEventBestEffort,
  NOTIFICATION_EVENT_TYPES,
} from "@/lib/notifications/events.server";
import {
  db,
} from "@/src/db";
import {
  assistanceApplications,
  auditLogs,
  campaigns,
  financialTransactions,
} from "@/src/db/schema";

export type AdminAssistanceActionState = {
  error: string | null;
};

type ReviewDecision =
  | "revision"
  | "approve"
  | "reject";

type FundingSource =
  | "cash"
  | "campaign";

function toCampaignSlug(
  title: string,
  applicationId: string,
) {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        90,
      ) ||
    "bantu-mereka";

  return `${base}-${applicationId.slice(0, 8)}`;
}

function parseRupiahInput(
  value: FormDataEntryValue | null,
  options: {
    allowZero: boolean;
  },
) {
  const raw =
    String(
      value || "",
    ).trim();

  if (
    !/^\d+$/.test(
      raw,
    )
  ) {
    return null;
  }

  const amount =
    Number(raw);

  if (
    !Number.isSafeInteger(
      amount,
    )
  ) {
    return null;
  }

  if (
    options.allowZero
      ? amount < 0
      : amount <= 0
  ) {
    return null;
  }

  return String(
    amount,
  );
}

const WIB_OFFSET_MS =
  7 * 60 * 60 * 1000;

function toWibDateKey(
  date: Date,
) {
  return new Date(
    date.getTime() +
      WIB_OFFSET_MS,
  )
    .toISOString()
    .slice(
      0,
      10,
    );
}
function refreshReviewPaths(
  applicationId: string,
) {
  revalidatePath(
    "/admin/pengajuan",
  );
  revalidatePath(
    `/admin/pengajuan/${applicationId}`,
  );
  revalidatePath(
    "/akun",
  );
  revalidatePath(
    "/akun/pengajuan",
  );
  revalidatePath(
    `/akun/pengajuan/${applicationId}`,
  );
  revalidatePath(
    "/bantuan",
  );
}

export async function reviewAssistanceApplication(
  _previousState:
    AdminAssistanceActionState,
  formData: FormData,
): Promise<AdminAssistanceActionState> {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
    return {
      error:
        "Sesi pengurus tidak valid. Silakan masuk kembali.",
    };
  }

  const applicationId =
    String(
      formData.get(
        "applicationId",
      ) || "",
    ).trim();

  const decision =
    String(
      formData.get(
        "decision",
      ) || "",
    ).trim() as ReviewDecision;

  const reviewNote =
    String(
      formData.get(
        "reviewNote",
      ) || "",
    ).trim();

  const fundingSource =
    String(
      formData.get(
        "fundingSource",
      ) || "",
    ).trim() as FundingSource;

  const approvedAmount =
    parseRupiahInput(
      formData.get(
        "approvedAmount",
      ),
      {
        allowZero: false,
      },
    );

  const operationalAmount =
    parseRupiahInput(
      formData.get(
        "operationalAmount",
      ),
      {
        allowZero: true,
      },
    );

  const campaignTarget =
    parseRupiahInput(
      formData.get(
        "campaignTarget",
      ),
      {
        allowZero: false,
      },
    );

  if (
    !applicationId
  ) {
    return {
      error:
        "ID pengajuan tidak valid.",
    };
  }

  if (
    decision !== "revision" &&
    decision !== "approve" &&
    decision !== "reject"
  ) {
    return {
      error:
        "Keputusan verifikasi tidak valid.",
    };
  }

  if (
    reviewNote.length >
    3000
  ) {
    return {
      error:
        "Catatan verifikasi maksimal 3.000 karakter.",
    };
  }

  if (
    (
      decision === "revision" ||
      decision === "reject"
    ) &&
    !reviewNote
  ) {
    return {
      error:
        decision === "revision"
          ? "Catatan wajib diisi saat meminta revisi."
          : "Alasan wajib diisi saat menolak pengajuan.",
    };
  }

  if (
    decision === "approve"
  ) {
    if (
      fundingSource !== "cash" &&
      fundingSource !== "campaign"
    ) {
      return {
        error:
          "Pilih sumber pendanaan Kas Ruang Sejahtera atau Kampanye.",
      };
    }

    if (
      approvedAmount === null
    ) {
      return {
        error:
          "Nominal bantuan yang disetujui harus lebih dari Rp0.",
      };
    }

    if (
      operationalAmount === null
    ) {
      return {
        error:
          "Biaya operasional harus berupa angka Rp0 atau lebih.",
      };
    }

    if (
      fundingSource === "campaign" &&
      campaignTarget === null
    ) {
      return {
        error:
          "Target kampanye harus lebih dari Rp0.",
      };
    }
  }

  const [existing] =
    await db
      .select({
        id:
          assistanceApplications.id,
        status:
          assistanceApplications.status,
        applicantId:
          assistanceApplications.applicantId,
        programId:
          assistanceApplications.programId,
        targetAmount:
          assistanceApplications.targetAmount,
        approvedAmount:
          assistanceApplications.approvedAmount,
        operationalAmount:
          assistanceApplications.operationalAmount,
        scheduledAt:
          assistanceApplications.scheduledAt,
        completedAt:
          assistanceApplications.completedAt,
        beneficiaryName:
          assistanceApplications.beneficiaryName,
        subdistrict:
          assistanceApplications.subdistrict,
        regency:
          assistanceApplications.regency,
        title:
          assistanceApplications.title,
        reviewNote:
          assistanceApplications.reviewNote,
        reviewedBy:
          assistanceApplications.reviewedBy,
        reviewedAt:
          assistanceApplications.reviewedAt,
        submittedAt:
          assistanceApplications.submittedAt,
        campaignId:
          campaigns.id,
      })
      .from(
        assistanceApplications,
      )
      .leftJoin(
        campaigns,
        eq(
          campaigns.applicationId,
          assistanceApplications.id,
        ),
      )
      .where(
        eq(
          assistanceApplications.id,
          applicationId,
        ),
      )
      .limit(1);

  if (!existing) {
    return {
      error:
        "Pengajuan tidak ditemukan.",
    };
  }

  if (
    existing.status !==
    "SUBMITTED"
  ) {
    return {
      error:
        "Hanya pengajuan berstatus Menunggu Verifikasi yang dapat diproses.",
    };
  }

  if (
    decision === "approve" &&
    existing.campaignId
  ) {
    return {
      error:
        "Pengajuan ini sudah memiliki kampanye dan tidak dapat disetujui ulang.",
    };
  }

  const nextStatus =
    decision === "revision"
      ? "NEEDS_REVISION"
      : decision === "approve"
        ? "APPROVED"
        : "REJECTED";

  const auditAction =
    decision === "revision"
      ? "REQUEST_APPLICATION_REVISION"
      : decision === "approve"
        ? "APPROVE_APPLICATION"
        : "REJECT_APPLICATION";

  try {
    await db.transaction(
      async (tx) => {
        const now =
          new Date();

        const [updated] =
          await tx
            .update(
              assistanceApplications,
            )
            .set({
              status:
                nextStatus,
              reviewNote:
                reviewNote ||
                null,
              reviewedBy:
                staff.id,
              reviewedAt:
                now,
              approvedAmount:
                decision ===
                "approve"
                  ? approvedAmount
                  : null,
              operationalAmount:
                decision ===
                "approve"
                  ? operationalAmount
                  : null,
              scheduledAt:
                null,
              completedAt:
                null,
              updatedAt:
                now,
            })
            .where(
              and(
                eq(
                  assistanceApplications.id,
                  applicationId,
                ),
                eq(
                  assistanceApplications.status,
                  "SUBMITTED",
                ),
              ),
            )
            .returning({
              id:
                assistanceApplications.id,
            });

        if (!updated) {
          throw new Error(
            "APPLICATION_ALREADY_REVIEWED",
          );
        }

        let createdCampaignId:
          | string
          | null = null;

        if (
          decision ===
            "approve" &&
          fundingSource ===
            "campaign"
        ) {
          const campaignSlug =
            toCampaignSlug(
              existing.title,
              applicationId,
            );

          const [
            createdCampaign,
          ] =
            await tx
              .insert(
                campaigns,
              )
              .values({
                applicationId,
                programId:
                  existing.programId,
                slug:
                  campaignSlug,
                title:
                  existing.title,
                summary: "",
                story: "",
                beneficiaryDisplayName:
                  existing.beneficiaryName,
                publicLocation:
                  [
                    existing.subdistrict,
                    existing.regency,
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(", "),
                targetAmount:
                  campaignTarget!,
                status:
                  "DRAFT",
                createdBy:
                  staff.id,
                updatedBy:
                  staff.id,
              })
              .onConflictDoNothing({
                target:
                  campaigns.applicationId,
              })
              .returning({
                id:
                  campaigns.id,
              });

          if (
            !createdCampaign
          ) {
            throw new Error(
              "APPLICATION_CAMPAIGN_ALREADY_EXISTS",
            );
          }

          createdCampaignId =
            createdCampaign.id;

          await tx
            .insert(
              auditLogs,
            )
            .values({
              userId:
                staff.id,
              action:
                "CREATE_CAMPAIGN_DRAFT",
              tableName:
                "campaigns",
              recordId:
                createdCampaign.id,
              newData: {
                applicationId,
                slug:
                  campaignSlug,
                status:
                  "DRAFT",
                targetAmount:
                  campaignTarget,
              },
            });
        }

        await tx
          .insert(
            auditLogs,
          )
          .values({
            userId:
              staff.id,
            action:
              auditAction,
            tableName:
              "assistance_applications",
            recordId:
              applicationId,
            oldData: {
              status:
                existing.status,
              reviewNote:
                existing.reviewNote,
              reviewedBy:
                existing.reviewedBy,
              reviewedAt:
                existing.reviewedAt,
              approvedAmount:
                existing.approvedAmount,
              operationalAmount:
                existing.operationalAmount,
              scheduledAt:
                existing.scheduledAt,
              completedAt:
                existing.completedAt,
            },
            newData: {
              status:
                nextStatus,
              reviewNote:
                reviewNote ||
                null,
              reviewedBy:
                staff.id,
              reviewedAt:
                now,
              applicantId:
                existing.applicantId,
              title:
                existing.title,
              requestedAmount:
                existing.targetAmount,
              approvedAmount:
                decision ===
                "approve"
                  ? approvedAmount
                  : null,
              operationalAmount:
                decision ===
                "approve"
                  ? operationalAmount
                  : null,
              fundingSource:
                decision ===
                "approve"
                  ? fundingSource
                  : null,
              campaignTarget:
                decision ===
                  "approve" &&
                fundingSource ===
                  "campaign"
                  ? campaignTarget
                  : null,
              campaignId:
                createdCampaignId,
            },
          });
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "APPLICATION_ALREADY_REVIEWED"
    ) {
      return {
        error:
          "Status pengajuan sudah berubah. Muat ulang halaman sebelum memproses kembali.",
      };
    }

    if (
      error instanceof Error &&
      error.message ===
        "APPLICATION_CAMPAIGN_ALREADY_EXISTS"
    ) {
      return {
        error:
          "Kampanye untuk pengajuan ini sudah ada. Muat ulang halaman sebelum melanjutkan.",
      };
    }

    console.error(
      "Review assistance application error:",
      error,
    );

    return {
      error:
        "Keputusan belum dapat disimpan. Silakan coba lagi.",
    };
  }

  if (
    notificationsEnabled()
  ) {
    const reviewCycle =
      existing.submittedAt
        ?.toISOString() ||
      "submitted";

    const applicantNotification =
      decision ===
        "revision"
        ? {
            type:
              NOTIFICATION_EVENT_TYPES.assistanceNeedsRevision,
            title:
              "Status pengajuan diperbarui",
            body:
              "Pengajuan Anda memerlukan tindak lanjut. Buka aplikasi untuk melihat detail.",
          }
        : decision ===
            "approve"
          ? {
              type:
                NOTIFICATION_EVENT_TYPES.assistanceApproved,
              title:
                "Status pengajuan diperbarui",
              body:
                "Status pengajuan Anda telah diperbarui. Buka aplikasi untuk melihat detail.",
            }
          : {
              type:
                NOTIFICATION_EVENT_TYPES.assistanceRejected,
              title:
                "Status pengajuan diperbarui",
              body:
                "Status pengajuan Anda telah diperbarui. Buka aplikasi untuk melihat detail.",
            };

    try {
      after(
        async () => {
          await createUserNotificationEventBestEffort({
            userId:
              existing.applicantId,
            type:
              applicantNotification.type,
            title:
              applicantNotification.title,
            body:
              applicantNotification.body,
            targetUrl:
              `/akun/pengajuan/${applicationId}`,
            dedupeKey:
              `assistance-review:${applicationId}:${reviewCycle}:${nextStatus}`,
          });
        },
      );
    } catch (error) {
      console.error(
        "[notifications] applicant review notification scheduling failed:",
        error instanceof Error
          ? error.message
          : "unknown_error",
      );
    }
  }

  refreshReviewPaths(
    applicationId,
  );

  redirect(
    `/admin/pengajuan/${applicationId}?reviewed=${decision}`,
  );
}

export async function scheduleAssistanceApplication(
  _previousState:
    AdminAssistanceActionState,
  formData: FormData,
): Promise<AdminAssistanceActionState> {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
    return {
      error:
        "Sesi pengurus tidak valid. Silakan masuk kembali.",
    };
  }

  const applicationId =
    String(
      formData.get(
        "applicationId",
      ) || "",
    ).trim();

  const scheduledDate =
    String(
      formData.get(
        "scheduledDate",
      ) || "",
    ).trim();

  if (!applicationId) {
    return {
      error:
        "ID pengajuan tidak valid.",
    };
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      scheduledDate,
    )
  ) {
    return {
      error:
        "Tanggal pelaksanaan tidak valid.",
    };
  }

  const scheduledAt =
    new Date(
      `${scheduledDate}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      scheduledAt.getTime(),
    )
  ) {
    return {
      error:
        "Tanggal pelaksanaan tidak valid.",
    };
  }

  const [existing] =
    await db
      .select({
        id:
          assistanceApplications.id,
        status:
          assistanceApplications.status,
        scheduledAt:
          assistanceApplications.scheduledAt,
        completedAt:
          assistanceApplications.completedAt,
        campaignId:
          campaigns.id,
        campaignTarget:
          campaigns.targetAmount,
      })
      .from(
        assistanceApplications,
      )
      .leftJoin(
        campaigns,
        eq(
          campaigns.applicationId,
          assistanceApplications.id,
        ),
      )
      .where(
        eq(
          assistanceApplications.id,
          applicationId,
        ),
      )
      .limit(1);

  if (!existing) {
    return {
      error:
        "Pengajuan tidak ditemukan.",
    };
  }

  if (
    existing.status !==
    "APPROVED"
  ) {
    return {
      error:
        "Jadwal hanya dapat ditetapkan untuk pengajuan yang telah disetujui.",
    };
  }

  if (
    existing.completedAt
  ) {
    return {
      error:
        "Kegiatan sudah ditandai selesai dan tidak dapat dijadwalkan ulang.",
    };
  }

  if (
    existing.campaignId &&
    existing.campaignTarget
  ) {
    const [funding] =
      await db
        .select({
          totalIn:
            sql<string>`
              COALESCE(
                SUM(
                  CASE
                    WHEN ${financialTransactions.type} = 'IN'
                    THEN ${financialTransactions.amount}
                    ELSE 0
                  END
                ),
                0
              )::text
            `,
          funded:
            sql<boolean>`
              COALESCE(
                SUM(
                  CASE
                    WHEN ${financialTransactions.type} = 'IN'
                    THEN ${financialTransactions.amount}
                    ELSE 0
                  END
                ),
                0
              ) >= CAST(${existing.campaignTarget} AS numeric)
            `,
        })
        .from(
          financialTransactions,
        )
        .where(
          and(
            eq(
              financialTransactions.campaignId,
              existing.campaignId,
            ),
            isNull(
              financialTransactions.deletedAt,
            ),
          ),
        );

    if (
      !funding?.funded
    ) {
      return {
        error:
          "Jadwal belum dapat ditetapkan karena dana kampanye belum memenuhi target.",
      };
    }
  }

  const now =
    new Date();

  const [updated] =
    await db
      .update(
        assistanceApplications,
      )
      .set({
        scheduledAt,
        updatedAt:
          now,
      })
      .where(
        and(
          eq(
            assistanceApplications.id,
            applicationId,
          ),
          eq(
            assistanceApplications.status,
            "APPROVED",
          ),
          isNull(
            assistanceApplications.completedAt,
          ),
        ),
      )
      .returning({
        id:
          assistanceApplications.id,
      });

  if (!updated) {
    return {
      error:
        "Status pengajuan berubah. Muat ulang halaman sebelum menjadwalkan.",
    };
  }

  await db
    .insert(
      auditLogs,
    )
    .values({
      userId:
        staff.id,
      action:
        existing.scheduledAt
          ? "RESCHEDULE_APPLICATION"
          : "SCHEDULE_APPLICATION",
      tableName:
        "assistance_applications",
      recordId:
        applicationId,
      oldData: {
        scheduledAt:
          existing.scheduledAt,
      },
      newData: {
        scheduledAt,
        scheduledDate,
        campaignId:
          existing.campaignId,
      },
    });

  refreshReviewPaths(
    applicationId,
  );

  redirect(
    `/admin/pengajuan/${applicationId}?scheduled=1`,
  );
}

export async function completeAssistanceApplication(
  _previousState:
    AdminAssistanceActionState,
  formData: FormData,
): Promise<AdminAssistanceActionState> {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
    return {
      error:
        "Sesi pengurus tidak valid. Silakan masuk kembali.",
    };
  }

  const applicationId =
    String(
      formData.get(
        "applicationId",
      ) || "",
    ).trim();

  if (!applicationId) {
    return {
      error:
        "ID pengajuan tidak valid.",
    };
  }

  const [existing] =
    await db
      .select({
        id:
          assistanceApplications.id,
        status:
          assistanceApplications.status,
        scheduledAt:
          assistanceApplications.scheduledAt,
        completedAt:
          assistanceApplications.completedAt,
      })
      .from(
        assistanceApplications,
      )
      .where(
        eq(
          assistanceApplications.id,
          applicationId,
        ),
      )
      .limit(1);

  if (!existing) {
    return {
      error:
        "Pengajuan tidak ditemukan.",
    };
  }

  if (
    existing.status !==
    "APPROVED"
  ) {
    return {
      error:
        "Hanya pengajuan yang telah disetujui yang dapat ditandai selesai.",
    };
  }

  if (
    !existing.scheduledAt
  ) {
    return {
      error:
        "Tetapkan jadwal pelaksanaan sebelum menandai kegiatan selesai.",
    };
  }

  if (
    existing.completedAt
  ) {
    return {
      error:
        "Kegiatan ini sudah ditandai selesai.",
    };
  }

  const now =
    new Date();

  if (
    toWibDateKey(
      existing.scheduledAt,
    ) >
    toWibDateKey(
      now,
    )
  ) {
    return {
      error:
        "Kegiatan belum dapat ditandai selesai sebelum tanggal pelaksanaan.",
    };
  }

  const [updated] =
    await db
      .update(
        assistanceApplications,
      )
      .set({
        completedAt:
          now,
        updatedAt:
          now,
      })
      .where(
        and(
          eq(
            assistanceApplications.id,
            applicationId,
          ),
          eq(
            assistanceApplications.status,
            "APPROVED",
          ),
          eq(
            assistanceApplications.scheduledAt,
            existing.scheduledAt,
          ),
          isNull(
            assistanceApplications.completedAt,
          ),
        ),
      )
      .returning({
        id:
          assistanceApplications.id,
      });

  if (!updated) {
    return {
      error:
        "Status atau jadwal kegiatan berubah. Muat ulang halaman sebelum memproses kembali.",
    };
  }

  await db
    .insert(
      auditLogs,
    )
    .values({
      userId:
        staff.id,
      action:
        "COMPLETE_APPLICATION",
      tableName:
        "assistance_applications",
      recordId:
        applicationId,
      oldData: {
        completedAt:
          existing.completedAt,
      },
      newData: {
        completedAt:
          now,
        scheduledAt:
          existing.scheduledAt,
      },
    });

  refreshReviewPaths(
    applicationId,
  );

  redirect(
    `/admin/pengajuan/${applicationId}?completed=1`,
  );
}
