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
  assistanceApplicationPhotos,
  assistanceApplications,
  auditLogs,
  campaigns,
  users,
} from "@/src/db/schema";

export type CampaignActionState = {
  error: string | null;
};

type CampaignIntent =
  | "save"
  | "activate"
  | "pause"
  | "complete"
  | "cancel";

function cleanText(
  value: FormDataEntryValue | null,
  maxLength: number,
) {
  const text =
    typeof value === "string"
      ? value.trim()
      : "";

  if (text.length > maxLength) {
    throw new Error(
      `Teks melebihi batas ${maxLength.toLocaleString("id-ID")} karakter.`,
    );
  }

  return text;
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

function refreshCampaignPaths(
  applicationId: string,
  slug: string,
) {
  revalidatePath(
    `/admin/pengajuan/${applicationId}`,
  );
  revalidatePath(
    `/admin/pengajuan/${applicationId}/kampanye`,
  );
  revalidatePath(
    "/admin/pengajuan",
  );
  revalidatePath(
    "/bantuan",
  );
  revalidatePath(
    `/bantuan/${slug}`,
  );
  revalidatePath(
    "/admin/keuangan/kampanye",
  );
}

export async function saveCampaign(
  applicationId: string,
  _previousState:
    CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const staff =
    await getStaffUser();

  if (!staff) {
    return {
      error:
        "Sesi pengurus tidak valid. Silakan masuk kembali.",
    };
  }

  const [
    record,
  ] =
    await db
      .select({
        id:
          campaigns.id,
        status:
          campaigns.status,
        slug:
          campaigns.slug,
        activatedAt:
          campaigns.activatedAt,
        completedAt:
          campaigns.completedAt,
        applicationStatus:
          assistanceApplications.status,
      })
      .from(campaigns)
      .innerJoin(
        assistanceApplications,
        eq(
          campaigns.applicationId,
          assistanceApplications.id,
        ),
      )
      .where(
        and(
          eq(
            campaigns.applicationId,
            applicationId,
          ),
          eq(
            assistanceApplications.id,
            applicationId,
          ),
        ),
      )
      .limit(1);

  if (!record) {
    return {
      error:
        "Kampanye belum tersedia untuk pengajuan ini.",
    };
  }

  if (
    record.applicationStatus !==
    "APPROVED"
  ) {
    return {
      error:
        "Hanya pengajuan yang telah disetujui yang dapat menjadi kampanye publik.",
    };
  }

  let title: string;
  let summary: string;
  let story: string;
  let beneficiaryDisplayName:
    string;
  let publicLocation:
    string;

  try {
    title =
      cleanText(
        formData.get("title"),
        180,
      );
    summary =
      cleanText(
        formData.get("summary"),
        600,
      );
    story =
      cleanText(
        formData.get("story"),
        10000,
      );
    beneficiaryDisplayName =
      cleanText(
        formData.get(
          "beneficiaryDisplayName",
        ),
        150,
      );
    publicLocation =
      cleanText(
        formData.get(
          "publicLocation",
        ),
        180,
      );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Data kampanye tidak valid.",
    };
  }

  const targetRaw =
    String(
      formData.get(
        "targetAmount",
      ) || "",
    )
      .replace(
        /[^0-9]/g,
        "",
      )
      .trim();

  const targetAmount =
    Number(targetRaw);

  if (
    !Number.isSafeInteger(
      targetAmount,
    ) ||
    targetAmount <= 0 ||
    targetAmount >
      10_000_000_000
  ) {
    return {
      error:
        "Target kampanye harus lebih dari Rp0 dan tidak melebihi Rp10 miliar.",
    };
  }

  const coverPhotoId =
    String(
      formData.get(
        "coverPhotoId",
      ) || "",
    ).trim();

  if (coverPhotoId) {
    const [photo] =
      await db
        .select({
          id:
            assistanceApplicationPhotos.id,
        })
        .from(
          assistanceApplicationPhotos,
        )
        .where(
          and(
            eq(
              assistanceApplicationPhotos.id,
              coverPhotoId,
            ),
            eq(
              assistanceApplicationPhotos.applicationId,
              applicationId,
            ),
          ),
        )
        .limit(1);

    if (!photo) {
      return {
        error:
          "Foto sampul tidak berasal dari pengajuan ini.",
      };
    }
  }

  const intent =
    String(
      formData.get(
        "intent",
      ) || "save",
    ) as CampaignIntent;

  if (
    intent !== "save" &&
    intent !== "activate" &&
    intent !== "pause" &&
    intent !== "complete" &&
    intent !== "cancel"
  ) {
    return {
      error:
        "Tindakan kampanye tidak valid.",
    };
  }

  if (
    (
      record.status ===
        "COMPLETED" ||
      record.status ===
        "CANCELLED"
    ) &&
    intent !== "save"
  ) {
    return {
      error:
        "Status kampanye ini sudah final.",
    };
  }

  let nextStatus =
    record.status;

  if (intent === "activate") {
    if (
      record.status !==
        "DRAFT" &&
      record.status !==
        "PAUSED"
    ) {
      return {
        error:
          "Kampanye hanya dapat diaktifkan dari status Draf atau Dijeda.",
      };
    }

    if (
      !title ||
      !summary ||
      !story ||
      !publicLocation ||
      !coverPhotoId
    ) {
      return {
        error:
          "Sebelum dipublikasikan, lengkapi judul, ringkasan, cerita publik, lokasi publik, dan foto sampul.",
      };
    }

    nextStatus =
      "ACTIVE";
  }

  if (intent === "pause") {
    if (
      record.status !==
      "ACTIVE"
    ) {
      return {
        error:
          "Hanya kampanye aktif yang dapat dijeda.",
      };
    }

    nextStatus =
      "PAUSED";
  }

  if (intent === "complete") {
    if (
      record.status !==
        "ACTIVE" &&
      record.status !==
        "PAUSED"
    ) {
      return {
        error:
          "Kampanye hanya dapat diselesaikan dari status Aktif atau Dijeda.",
      };
    }

    nextStatus =
      "COMPLETED";
  }

  if (intent === "cancel") {
    if (
      record.status ===
        "COMPLETED" ||
      record.status ===
        "CANCELLED"
    ) {
      return {
        error:
          "Kampanye ini tidak dapat dibatalkan.",
      };
    }

    nextStatus =
      "CANCELLED";
  }

  if (
    intent === "save" &&
    (
      record.status ===
        "COMPLETED" ||
      record.status ===
        "CANCELLED"
    )
  ) {
    return {
      error:
        "Kampanye dengan status final tidak dapat diubah.",
    };
  }

  const now =
    new Date();

  try {
    await db.transaction(
      async (tx) => {
        await tx
          .update(campaigns)
          .set({
            title,
            summary,
            story,
            beneficiaryDisplayName:
              beneficiaryDisplayName ||
              null,
            publicLocation:
              publicLocation || null,
            targetAmount:
              targetAmount.toString(),
            coverPhotoId:
              coverPhotoId || null,
            status:
              nextStatus,
            activatedAt:
              intent ===
              "activate"
                ? (
                    record.activatedAt ||
                    now
                  )
                : undefined,
            completedAt:
              intent ===
              "complete"
                ? now
                : record.completedAt,
            updatedBy:
              staff.id,
            updatedAt:
              now,
          })
          .where(
            eq(
              campaigns.id,
              record.id,
            ),
          );

        await tx
          .insert(auditLogs)
          .values({
            userId:
              staff.id,
            action:
              intent ===
              "activate"
                ? "ACTIVATE_CAMPAIGN"
                : intent ===
                    "pause"
                  ? "PAUSE_CAMPAIGN"
                  : intent ===
                      "complete"
                    ? "COMPLETE_CAMPAIGN"
                    : intent ===
                        "cancel"
                      ? "CANCEL_CAMPAIGN"
                      : "UPDATE_CAMPAIGN",
            tableName:
              "campaigns",
            recordId:
              record.id,
            oldData: {
              status:
                record.status,
            },
            newData: {
              status:
                nextStatus,
              title,
              targetAmount,
              coverPhotoId:
                coverPhotoId ||
                null,
              publicLocation:
                publicLocation ||
                null,
            },
          });
      },
    );
  } catch (error) {
    console.error(
      "Save campaign error:",
      error,
    );

    return {
      error:
        "Kampanye belum dapat disimpan. Silakan coba lagi.",
    };
  }

  refreshCampaignPaths(
    applicationId,
    record.slug,
  );

  redirect(
    `/admin/pengajuan/${applicationId}/kampanye?saved=${intent}`,
  );
}
