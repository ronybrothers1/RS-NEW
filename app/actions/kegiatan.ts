"use server";

import { getCurrentStaffUser } from "@/lib/current-authz";
import { PUBLIC_ACTIVITIES_CACHE_TAG } from "@/lib/public-activities";
import { db } from "@/src/db";
import { activities, auditLogs } from "@/src/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";

export type KegiatanActionState = {
  success: boolean;
  error: string | null;
  id?: string;
};

function cleanOptional(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isRevision(value: string | null) {
  return Boolean(
    value &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{1,6})?$/.test(
        value,
      ),
  );
}

function matchesRevision(revision: string) {
  return sql`${activities.updatedAt} = ${revision}::timestamp`;
}

const ACTIVITY_STATE_CHANGED = "ACTIVITY_STATE_CHANGED";

function activityStateChangedResult(): KegiatanActionState {
  return {
    success: false,
    error:
      "Kegiatan sudah berubah sejak halaman dibuka. Muat ulang halaman sebelum melanjutkan.",
  };
}

function isDirectTikTokVideoUrl(value: string) {
  return /^https:\/\/(?:www\.)?tiktok\.com\/@[^/]+\/video\/\d+(?:[/?#].*)?$/i.test(
    value,
  );
}

function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return `${base || "kegiatan"}-${Date.now()}`;
}

function revalidateKegiatan(slug?: string | null) {
  revalidateTag(PUBLIC_ACTIVITIES_CACHE_TAG);
  revalidatePath("/admin/kegiatan");
  revalidatePath("/admin/dashboard");
  revalidatePath("/kegiatan");

  if (slug) {
    revalidatePath(`/kegiatan/${slug}`);
  }
}

export async function saveKegiatan(
  _prevState: KegiatanActionState,
  formData: FormData,
): Promise<KegiatanActionState> {
  const staff = await getCurrentStaffUser();

  if (!staff) {
    return {
      success: false,
      error: "Anda harus login untuk mengelola kegiatan.",
    };
  }

  const id = cleanOptional(formData.get("id"));
  const revision = cleanOptional(formData.get("revision"));
  const title = cleanOptional(formData.get("title"));
  const programId = cleanOptional(formData.get("programId"));
  const dateStr = cleanOptional(formData.get("date"));
  const location = cleanOptional(formData.get("location"));
  const description = cleanOptional(formData.get("description"));
  const tiktokUrl = cleanOptional(formData.get("tiktokUrl"));
  const status = cleanOptional(formData.get("status"));

  if (!title || !programId || !dateStr || !description) {
    return {
      success: false,
      error: "Judul, program, tanggal, dan deskripsi wajib diisi.",
    };
  }

  if (
    status !== "DRAFT" &&
    status !== "PUBLISHED" &&
    status !== "ARCHIVED"
  ) {
    return {
      success: false,
      error: "Status kegiatan tidak valid.",
    };
  }

  if (!isUuid(programId)) {
    return {
      success: false,
      error: "Program yang dipilih tidak valid.",
    };
  }

  if (id && !isUuid(id)) {
    return {
      success: false,
      error: "ID kegiatan tidak valid.",
    };
  }

  if (id && !isRevision(revision)) {
    return activityStateChangedResult();
  }

  if (title.length > 180) {
    return {
      success: false,
      error: "Judul kegiatan maksimal 180 karakter.",
    };
  }

  if (location && location.length > 300) {
    return {
      success: false,
      error: "Lokasi maksimal 300 karakter.",
    };
  }

  if (description.length > 5000) {
    return {
      success: false,
      error: "Deskripsi maksimal 5.000 karakter.",
    };
  }

  if (tiktokUrl && !isDirectTikTokVideoUrl(tiktokUrl)) {
    return {
      success: false,
      error:
        "Gunakan URL video TikTok lengkap, misalnya https://www.tiktok.com/@username/video/1234567890.",
    };
  }

  const activityDate = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(activityDate.getTime())) {
    return {
      success: false,
      error: "Tanggal kegiatan tidak valid.",
    };
  }

  const isPublished = status === "PUBLISHED";
  const isArchived = status === "ARCHIVED";

  try {
    if (id) {
      const result = await db.transaction(async (tx) => {
        const [oldData] = await tx
          .select()
          .from(activities)
          .where(eq(activities.id, id))
          .limit(1);

        if (!oldData) {
          throw new Error("ACTIVITY_NOT_FOUND");
        }

        const [updated] = await tx
          .update(activities)
          .set({
            title,
            programId,
            date: activityDate,
            location,
            description,
            tiktokUrl,
            isPublished,
            archivedAt: isArchived
              ? oldData.archivedAt ?? new Date()
              : null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(activities.id, id),
              matchesRevision(revision!),
            ),
          )
          .returning();

        if (!updated) {
          throw new Error(ACTIVITY_STATE_CHANGED);
        }

        await tx.insert(auditLogs).values({
          userId: staff.id,
          action: isArchived ? "ARCHIVE" : "UPDATE",
          tableName: "activities",
          recordId: id,
          oldData,
          newData: updated,
        });

        return {
          id: updated.id,
          slug: oldData.slug,
        };
      });

      revalidateKegiatan(result.slug);

      return {
        success: true,
        error: null,
        id: result.id,
      };
    }

    const created = await db.transaction(async (tx) => {
      const [newActivity] = await tx
        .insert(activities)
        .values({
          title,
          slug: makeSlug(title),
          programId,
          date: activityDate,
          location,
          description,
          tiktokUrl,
          isPublished,
          archivedAt: isArchived ? new Date() : null,
          updatedAt: new Date(),
        })
        .returning();

      await tx.insert(auditLogs).values({
        userId: staff.id,
        action: "CREATE",
        tableName: "activities",
        recordId: newActivity.id,
        newData: newActivity,
      });

      return newActivity;
    });

    revalidateKegiatan(created.slug);

    return {
      success: true,
      error: null,
      id: created.id,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === ACTIVITY_STATE_CHANGED
    ) {
      return activityStateChangedResult();
    }

    if (
      error instanceof Error &&
      error.message === "ACTIVITY_NOT_FOUND"
    ) {
      return {
        success: false,
        error: "Kegiatan tidak ditemukan.",
      };
    }

    return {
      success: false,
      error: "Gagal menyimpan kegiatan.",
    };
  }
}

export async function archiveKegiatan(
  id: string,
  revision: string,
) {
  const staff = await getCurrentStaffUser();

  if (!staff) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error: "ID kegiatan tidak valid.",
    };
  }

  if (!isRevision(revision)) {
    return activityStateChangedResult();
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [oldData] = await tx
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (!oldData) {
        throw new Error("ACTIVITY_NOT_FOUND");
      }

      if (oldData.archivedAt) {
        return {
          slug: oldData.slug,
          changed: false,
        };
      }

      const [updated] = await tx
        .update(activities)
        .set({
          isPublished: false,
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(activities.id, id),
            matchesRevision(revision),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error(ACTIVITY_STATE_CHANGED);
      }

      await tx.insert(auditLogs).values({
        userId: staff.id,
        action: "ARCHIVE",
        tableName: "activities",
        recordId: id,
        oldData,
        newData: updated,
      });

      return {
        slug: oldData.slug,
        changed: true,
      };
    });

    if (result.changed) {
      revalidateKegiatan(result.slug);
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === ACTIVITY_STATE_CHANGED
    ) {
      return activityStateChangedResult();
    }

    if (
      error instanceof Error &&
      error.message === "ACTIVITY_NOT_FOUND"
    ) {
      return {
        success: false,
        error: "Kegiatan tidak ditemukan.",
      };
    }

    return {
      success: false,
      error: "Gagal mengarsipkan kegiatan.",
    };
  }
}

export async function deleteKegiatan(
  id: string,
  revision: string,
) {
  const staff = await getCurrentStaffUser();

  if (!staff) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error: "ID kegiatan tidak valid.",
    };
  }

  if (!isRevision(revision)) {
    return activityStateChangedResult();
  }

  try {
    const slug = await db.transaction(async (tx) => {
      const [oldData] = await tx
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (!oldData) {
        throw new Error("ACTIVITY_NOT_FOUND");
      }

      if (oldData.isPublished && !oldData.archivedAt) {
        throw new Error("ACTIVITY_STILL_PUBLISHED");
      }

      const [deleted] = await tx
        .delete(activities)
        .where(
          and(
            eq(activities.id, id),
            matchesRevision(revision),
          ),
        )
        .returning({
          id: activities.id,
        });

      if (!deleted) {
        throw new Error(ACTIVITY_STATE_CHANGED);
      }

      await tx.insert(auditLogs).values({
        userId: staff.id,
        action: "DELETE",
        tableName: "activities",
        recordId: id,
        oldData,
      });

      return oldData.slug;
    });

    revalidateKegiatan(slug);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === ACTIVITY_STATE_CHANGED
    ) {
      return activityStateChangedResult();
    }

    if (
      error instanceof Error &&
      error.message === "ACTIVITY_NOT_FOUND"
    ) {
      return {
        success: false,
        error: "Kegiatan tidak ditemukan.",
      };
    }

    if (
      error instanceof Error &&
      error.message === "ACTIVITY_STILL_PUBLISHED"
    ) {
      return {
        success: false,
        error:
          "Kegiatan yang masih dipublikasi harus diarsipkan terlebih dahulu sebelum dihapus permanen.",
      };
    }

    return {
      success: false,
      error: "Gagal menghapus kegiatan.",
    };
  }
}

export async function togglePublishKegiatan(
  id: string,
  currentStatus: boolean,
  revision: string,
) {
  const staff = await getCurrentStaffUser();

  if (!staff) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error: "ID kegiatan tidak valid.",
    };
  }

  if (!isRevision(revision)) {
    return activityStateChangedResult();
  }

  try {
    const slug = await db.transaction(async (tx) => {
      const [oldData] = await tx
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (!oldData) {
        throw new Error("ACTIVITY_NOT_FOUND");
      }

      if (
        oldData.isPublished !== currentStatus ||
        oldData.archivedAt
      ) {
        throw new Error(ACTIVITY_STATE_CHANGED);
      }

      const nextStatus = !oldData.isPublished;

      const [updated] = await tx
        .update(activities)
        .set({
          isPublished: nextStatus,
          archivedAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(activities.id, id),
            eq(activities.isPublished, currentStatus),
            matchesRevision(revision),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error(ACTIVITY_STATE_CHANGED);
      }

      await tx.insert(auditLogs).values({
        userId: staff.id,
        action: nextStatus ? "PUBLISH" : "UPDATE",
        tableName: "activities",
        recordId: id,
        oldData,
        newData: updated,
      });

      return oldData.slug;
    });

    revalidateKegiatan(slug);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === ACTIVITY_STATE_CHANGED
    ) {
      return activityStateChangedResult();
    }

    if (
      error instanceof Error &&
      error.message === "ACTIVITY_NOT_FOUND"
    ) {
      return {
        success: false,
        error: "Kegiatan tidak ditemukan.",
      };
    }

    return {
      success: false,
      error: "Gagal mengubah status publikasi.",
    };
  }
}
