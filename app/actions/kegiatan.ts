"use server";

import { auth } from "@/auth";
import { db } from "@/src/db";
import { activities, auditLogs } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Anda harus login untuk mengelola kegiatan.",
    };
  }

  const id = cleanOptional(formData.get("id"));
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
      const [oldData] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, id))
        .limit(1);

      if (!oldData) {
        return {
          success: false,
          error: "Kegiatan tidak ditemukan.",
        };
      }

      const [updated] = await db
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
        .where(eq(activities.id, id))
        .returning();

      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: isArchived ? "ARCHIVE" : "UPDATE",
        tableName: "activities",
        recordId: id,
        oldData,
        newData: updated,
      });

      revalidateKegiatan(oldData.slug);

      return {
        success: true,
        error: null,
        id,
      };
    }

    const [created] = await db
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

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "CREATE",
      tableName: "activities",
      recordId: created.id,
      newData: created,
    });

    revalidateKegiatan(created.slug);

    return {
      success: true,
      error: null,
      id: created.id,
    };
  } catch {
    return {
      success: false,
      error: "Gagal menyimpan kegiatan.",
    };
  }
}

export async function archiveKegiatan(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
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

  try {
    const [oldData] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!oldData) {
      return {
        success: false,
        error: "Kegiatan tidak ditemukan.",
      };
    }

    if (oldData.archivedAt) {
      return {
        success: true,
        error: null,
      };
    }

    const [updated] = await db
      .update(activities)
      .set({
        isPublished: false,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(activities.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "ARCHIVE",
      tableName: "activities",
      recordId: id,
      oldData,
      newData: updated,
    });

    revalidateKegiatan(oldData.slug);

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "Gagal mengarsipkan kegiatan.",
    };
  }
}

export async function deleteKegiatan(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
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

  try {
    const [oldData] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!oldData) {
      return {
        success: false,
        error: "Kegiatan tidak ditemukan.",
      };
    }

    if (oldData.isPublished && !oldData.archivedAt) {
      return {
        success: false,
        error:
          "Kegiatan yang masih dipublikasi harus diarsipkan terlebih dahulu sebelum dihapus permanen.",
      };
    }

    await db
      .delete(activities)
      .where(eq(activities.id, id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "DELETE",
      tableName: "activities",
      recordId: id,
      oldData,
    });

    revalidateKegiatan(oldData.slug);

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "Gagal menghapus kegiatan.",
    };
  }
}

export async function togglePublishKegiatan(
  id: string,
  currentStatus: boolean,
) {
  const session = await auth();

  if (!session?.user?.id) {
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

  try {
    const [oldData] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!oldData) {
      return {
        success: false,
        error: "Kegiatan tidak ditemukan.",
      };
    }

    const nextStatus = !currentStatus;

    const [updated] = await db
      .update(activities)
      .set({
        isPublished: nextStatus,
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: nextStatus ? "PUBLISH" : "UPDATE",
      tableName: "activities",
      recordId: id,
      oldData,
      newData: updated,
    });

    revalidateKegiatan(oldData.slug);

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "Gagal mengubah status publikasi.",
    };
  }
}
