"use server";

import { db } from "@/src/db";
import { activities, auditLogs } from "@/src/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createKegiatan(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;
  const dateStr = formData.get("date") as string;
  const tiktokUrl = formData.get("tiktokUrl") as string;
  const isPublishedStr = formData.get("isPublished") as string;
  // TODO: Image upload handling. For now we accept an image URL.
  const imageUrl = formData.get("imageUrl") as string;

  if (!title || !description || !dateStr) {
    return { success: false, error: "Judul, deskripsi, dan tanggal wajib diisi." };
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

  try {
    const [newActivity] = await db.insert(activities).values({
      title,
      slug,
      date: new Date(dateStr),
      location,
      description,
      imageUrl,
      tiktokUrl,
      isPublished: isPublishedStr === 'true',
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'activities',
      recordId: newActivity.id,
      newData: newActivity,
    });

    revalidatePath('/admin/kegiatan');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menyimpan kegiatan." };
  }
}

export async function deleteKegiatan(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [oldData] = await db.select().from(activities).where(eq(activities.id, id));
    if (!oldData) {
      return { success: false, error: "Kegiatan tidak ditemukan." };
    }

    await db.delete(activities).where(eq(activities.id, id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'DELETE',
      tableName: 'activities',
      recordId: id,
      oldData,
    });

    revalidatePath('/admin/kegiatan');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menghapus kegiatan." };
  }
}

export async function togglePublishKegiatan(id: string, currentStatus: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [updated] = await db.update(activities)
      .set({ isPublished: !currentStatus })
      .where(eq(activities.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'UPDATE',
      tableName: 'activities',
      recordId: id,
      newData: updated,
    });

    revalidatePath('/admin/kegiatan');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal mengubah status publikasi." };
  }
}
