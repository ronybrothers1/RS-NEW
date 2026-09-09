"use server";

import {
  and,
  eq,
} from "drizzle-orm";
import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/auth";
import {
  db,
} from "@/src/db";
import {
  assistanceApplications,
  auditLogs,
  campaigns,
  users,
} from "@/src/db/schema";

export type AdminAssistanceActionState = {
  error: string | null;
};

type ReviewDecision =
  | "revision"
  | "approve"
  | "reject";

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

async function getStaffUser() {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  const sessionRole = (
    session?.user as
      | {
          role?: string;
        }
      | undefined
  )?.role;

  if (
    !userId ||
    (
      sessionRole !== "ADMIN" &&
      sessionRole !== "OPERATOR"
    )
  ) {
    return null;
  }

  const [user] =
    await db
      .select({
        id: users.id,
        role: users.role,
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
    (
      user.role !== "ADMIN" &&
      user.role !== "OPERATOR"
    )
  ) {
    return null;
  }

  return user;
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
    await getStaffUser();

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
    "SUBMITTED"
  ) {
    return {
      error:
        "Hanya pengajuan berstatus Menunggu Verifikasi yang dapat diproses.",
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

if (
  decision ===
  "approve"
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
          existing.targetAmount,
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
    createdCampaign
  ) {
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
        },
      });
  }
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

    console.error(
      "Review assistance application error:",
      error,
    );

    return {
      error:
        "Keputusan belum dapat disimpan. Silakan coba lagi.",
    };
  }

  refreshReviewPaths(
    applicationId,
  );

  redirect(
    `/admin/pengajuan/${applicationId}?reviewed=${decision}`,
  );
}
