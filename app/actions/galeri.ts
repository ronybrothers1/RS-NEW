"use server";

import { db } from "@/src/db";
import { gallery, auditLogs } from "@/src/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createGaleri(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const videoUrl = formData.get("videoUrl") as string;
  const isPublishedStr = formData.get("isPublished") as string;

  if (!imageUrl && !videoUrl) {
    return { success: false, error: "URL Gambar atau URL Video wajib diisi salah satu." };
  }

  try {
    const [newGallery] = await db.insert(gallery).values({
      title: title || null,
      description: description || null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      isPublished: isPublishedStr === 'true',
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'gallery',
      recordId: newGallery.id,
      newData: newGallery,
    });

    revalidatePath('/admin/galeri');
    revalidatePath('/galeri');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menyimpan galeri." };
  }
}

export async function deleteGaleri(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [oldData] = await db.select().from(gallery).where(eq(gallery.id, id));
    if (!oldData) {
      return { success: false, error: "Data galeri tidak ditemukan." };
    }

    await db.delete(gallery).where(eq(gallery.id, id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'DELETE',
      tableName: 'gallery',
      recordId: id,
      oldData,
    });

    revalidatePath('/admin/galeri');
    revalidatePath('/galeri');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menghapus data galeri." };
  }
}

export async function togglePublishGaleri(id: string, currentStatus: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [updated] = await db.update(gallery)
      .set({ isPublished: !currentStatus })
      .where(eq(gallery.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'UPDATE',
      tableName: 'gallery',
      recordId: id,
      newData: updated,
    });

    revalidatePath('/admin/galeri');
    revalidatePath('/galeri');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal mengubah status publikasi." };
  }
}
