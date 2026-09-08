"use server";

import { db } from "@/src/db";
import { articles, auditLogs } from "@/src/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function createBerita(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  let slug = formData.get("slug") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const imageAlt = formData.get("imageAlt") as string;
  const metaTitle = formData.get("metaTitle") as string;
  const metaDescription = formData.get("metaDescription") as string;
  const status = formData.get("status") as "DRAFT" | "PUBLISHED";

  if (!title || !content) {
    return { success: false, error: "Judul dan konten wajib diisi." };
  }

  if (!slug) {
    slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
  } else {
    slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  }

  try {
    const [newArticle] = await db.insert(articles).values({
      title,
      slug,
      content,
      excerpt,
      imageUrl,
      imageAlt,
      metaTitle,
      metaDescription,
      status: status || 'DRAFT',
      authorId: session.user.id,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'CREATE',
      tableName: 'articles',
      recordId: newArticle.id,
      newData: newArticle,
    });

    revalidatePath('/admin/berita');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menyimpan artikel. Mungkin slug sudah terpakai." };
  }
}

export async function deleteBerita(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [oldData] = await db.select().from(articles).where(eq(articles.id, id));
    if (!oldData) {
      return { success: false, error: "Artikel tidak ditemukan." };
    }

    await db.delete(articles).where(eq(articles.id, id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'DELETE',
      tableName: 'articles',
      recordId: id,
      oldData,
    });

    revalidatePath('/admin/berita');
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: "Gagal menghapus artikel." };
  }
}
