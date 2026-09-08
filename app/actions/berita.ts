"use server";

import { auth } from "@/auth";
import { db } from "@/src/db";
import { articles, auditLogs } from "@/src/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasMeaningfulArticleContent } from "@/lib/article-content";

type ArticleStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

type ActionResult = {
  success: boolean;
  error: string | null;
  id?: string;
  slug?: string;
};

const CREATE_STATUSES: ArticleStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
];

const UPDATE_STATUSES: ArticleStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function cleanOptional(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function parseScheduledAt(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

async function getEditorSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const role = (session.user as { role?: string }).role;

  if (role !== "ADMIN" && role !== "OPERATOR") {
    return null;
  }

  return session;
}

async function makeUniqueSlug(baseValue: string, excludeId?: string) {
  const base = slugify(baseValue) || "berita";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const where = excludeId
      ? and(eq(articles.slug, candidate), ne(articles.id, excludeId))
      : eq(articles.slug, candidate);

    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(where)
      .limit(1);

    if (existing.length === 0) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function getLifecycleForCreate(
  status: ArticleStatus,
  scheduledAt: Date | null,
) {
  const now = new Date();

  if (status === "PUBLISHED") {
    return {
      publishedAt: now,
      scheduledAt: null,
      archivedAt: null,
    };
  }

  if (status === "SCHEDULED") {
    return {
      publishedAt: null,
      scheduledAt,
      archivedAt: null,
    };
  }

  return {
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
  };
}

function getLifecycleForUpdate(
  oldStatus: ArticleStatus,
  oldPublishedAt: Date | null,
  status: ArticleStatus,
  scheduledAt: Date | null,
) {
  const now = new Date();

  if (status === "PUBLISHED") {
    return {
      publishedAt:
        oldStatus === "PUBLISHED" && oldPublishedAt
          ? oldPublishedAt
          : now,
      scheduledAt: null,
      archivedAt: null,
    };
  }

  if (status === "SCHEDULED") {
    return {
      publishedAt: oldPublishedAt,
      scheduledAt,
      archivedAt: null,
    };
  }

  if (status === "ARCHIVED") {
    return {
      publishedAt: oldPublishedAt,
      scheduledAt: null,
      archivedAt: now,
    };
  }

  return {
    publishedAt: oldPublishedAt,
    scheduledAt: null,
    archivedAt: null,
  };
}

function getAuditAction(
  oldStatus: ArticleStatus,
  newStatus: ArticleStatus,
) {
  if (newStatus === "PUBLISHED" && oldStatus !== "PUBLISHED") {
    return "PUBLISH";
  }

  if (newStatus === "ARCHIVED" && oldStatus !== "ARCHIVED") {
    return "ARCHIVE";
  }

  if (newStatus === "SCHEDULED" && oldStatus !== "SCHEDULED") {
    return "SCHEDULE";
  }

  return "UPDATE";
}

export async function createBerita(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getEditorSession();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Anda tidak memiliki akses untuk membuat berita.",
    };
  }

  const title = cleanOptional(formData.get("title"));
  const rawContent = cleanOptional(formData.get("content"));

  if (!title || !rawContent) {
    return {
      success: false,
      error: "Judul dan konten wajib diisi.",
    };
  }

  const checkedContent = hasMeaningfulArticleContent(rawContent);

  if (!checkedContent.meaningful) {
    return {
      success: false,
      error: "Isi berita masih kosong. Tambahkan teks atau media.",
    };
  }

  const content = checkedContent.sanitized;
  const imageCaption = cleanOptional(formData.get("imageCaption"));

  if (imageCaption && imageCaption.length > 300) {
    return {
      success: false,
      error: "Caption gambar maksimal 300 karakter.",
    };
  }

  const rawStatus = cleanOptional(formData.get("status")) ?? "DRAFT";

  if (!CREATE_STATUSES.includes(rawStatus as ArticleStatus)) {
    return {
      success: false,
      error: "Status artikel tidak valid.",
    };
  }

  const status = rawStatus as ArticleStatus;
  const scheduledAt = parseScheduledAt(formData.get("scheduledAt"));

  if (status === "SCHEDULED") {
    if (!scheduledAt) {
      return {
        success: false,
        error: "Tanggal dan waktu publikasi wajib diisi untuk berita terjadwal.",
      };
    }

    if (scheduledAt.getTime() <= Date.now()) {
      return {
        success: false,
        error: "Jadwal publikasi harus berada di waktu yang akan datang.",
      };
    }
  }

  const requestedSlug =
    cleanOptional(formData.get("slug")) ?? title;

  const slug = await makeUniqueSlug(requestedSlug);

  const lifecycle = getLifecycleForCreate(status, scheduledAt);

  try {
    const [newArticle] = await db
      .insert(articles)
      .values({
        title,
        slug,
        content,
        excerpt: cleanOptional(formData.get("excerpt")),
        imageUrl: cleanOptional(formData.get("imageUrl")),
        imageAlt: cleanOptional(formData.get("imageAlt")),
        imageCaption,
        metaTitle: cleanOptional(formData.get("metaTitle")),
        metaDescription: cleanOptional(formData.get("metaDescription")),
        status,
        authorId: session.user.id,
        updatedAt: new Date(),
        ...lifecycle,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: status === "PUBLISHED" ? "PUBLISH" : "CREATE",
      tableName: "articles",
      recordId: newArticle.id,
      newData: newArticle,
    });

    revalidatePath("/admin/berita");
    revalidatePath("/admin/dashboard");
    revalidatePath("/berita");

    return {
      success: true,
      error: null,
      id: newArticle.id,
      slug: newArticle.slug,
    };
  } catch {
    return {
      success: false,
      error: "Gagal menyimpan artikel.",
    };
  }
}

export async function updateBerita(
  id: string,
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getEditorSession();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Anda tidak memiliki akses untuk mengubah berita.",
    };
  }

  const [oldArticle] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  if (!oldArticle) {
    return {
      success: false,
      error: "Artikel tidak ditemukan.",
    };
  }

  const title = cleanOptional(formData.get("title"));
  const rawContent = cleanOptional(formData.get("content"));

  if (!title || !rawContent) {
    return {
      success: false,
      error: "Judul dan konten wajib diisi.",
    };
  }

  const checkedContent = hasMeaningfulArticleContent(rawContent);

  if (!checkedContent.meaningful) {
    return {
      success: false,
      error: "Isi berita masih kosong. Tambahkan teks atau media.",
    };
  }

  const content = checkedContent.sanitized;
  const imageCaption = cleanOptional(formData.get("imageCaption"));

  if (imageCaption && imageCaption.length > 300) {
    return {
      success: false,
      error: "Caption gambar maksimal 300 karakter.",
    };
  }

  const rawStatus =
    cleanOptional(formData.get("status")) ?? oldArticle.status;

  if (!UPDATE_STATUSES.includes(rawStatus as ArticleStatus)) {
    return {
      success: false,
      error: "Status artikel tidak valid.",
    };
  }

  const status = rawStatus as ArticleStatus;
  const scheduledAt = parseScheduledAt(formData.get("scheduledAt"));

  if (status === "SCHEDULED") {
    if (!scheduledAt) {
      return {
        success: false,
        error: "Tanggal dan waktu publikasi wajib diisi untuk berita terjadwal.",
      };
    }

    if (scheduledAt.getTime() <= Date.now()) {
      return {
        success: false,
        error: "Jadwal publikasi harus berada di waktu yang akan datang.",
      };
    }
  }

  const requestedSlug =
    cleanOptional(formData.get("slug")) ?? title;

  const slug = await makeUniqueSlug(requestedSlug, id);

  const lifecycle = getLifecycleForUpdate(
    oldArticle.status,
    oldArticle.publishedAt,
    status,
    scheduledAt,
  );

  try {
    const [updatedArticle] = await db
      .update(articles)
      .set({
        title,
        slug,
        content,
        excerpt: cleanOptional(formData.get("excerpt")),
        imageUrl: cleanOptional(formData.get("imageUrl")),
        imageAlt: cleanOptional(formData.get("imageAlt")),
        imageCaption,
        metaTitle: cleanOptional(formData.get("metaTitle")),
        metaDescription: cleanOptional(formData.get("metaDescription")),
        status,
        updatedAt: new Date(),
        ...lifecycle,
      })
      .where(eq(articles.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: getAuditAction(oldArticle.status, status),
      tableName: "articles",
      recordId: id,
      oldData: oldArticle,
      newData: updatedArticle,
    });

    revalidatePath("/admin/berita");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/berita/${id}/edit`);
    revalidatePath("/berita");
    revalidatePath(`/berita/${oldArticle.slug}`);
    revalidatePath(`/berita/${updatedArticle.slug}`);

    return {
      success: true,
      error: null,
      id,
      slug: updatedArticle.slug,
    };
  } catch {
    return {
      success: false,
      error: "Gagal memperbarui artikel.",
    };
  }
}

export async function archiveBerita(
  id: string,
): Promise<ActionResult> {
  const session = await getEditorSession();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Anda tidak memiliki akses untuk mengarsipkan berita.",
    };
  }

  const [oldArticle] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  if (!oldArticle) {
    return {
      success: false,
      error: "Artikel tidak ditemukan.",
    };
  }

  if (oldArticle.status === "ARCHIVED") {
    return {
      success: true,
      error: null,
      id,
      slug: oldArticle.slug,
    };
  }

  const [updatedArticle] = await db
    .update(articles)
    .set({
      status: "ARCHIVED",
      archivedAt: new Date(),
      scheduledAt: null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "ARCHIVE",
    tableName: "articles",
    recordId: id,
    oldData: oldArticle,
    newData: updatedArticle,
  });

  revalidatePath("/admin/berita");
  revalidatePath("/berita");
  revalidatePath(`/berita/${oldArticle.slug}`);

  return {
    success: true,
    error: null,
    id,
    slug: updatedArticle.slug,
  };
}

export async function deleteBerita(
  id: string,
): Promise<ActionResult> {
  const session = await getEditorSession();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Anda tidak memiliki akses untuk menghapus berita.",
    };
  }

  try {
    const [oldArticle] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!oldArticle) {
      return {
        success: false,
        error: "Artikel tidak ditemukan.",
      };
    }

    if (
      oldArticle.status === "PUBLISHED" ||
      oldArticle.status === "SCHEDULED"
    ) {
      return {
        success: false,
        error: "Artikel aktif harus diarsipkan terlebih dahulu sebelum dihapus permanen.",
      };
    }

    await db
      .delete(articles)
      .where(eq(articles.id, id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "DELETE",
      tableName: "articles",
      recordId: id,
      oldData: oldArticle,
    });

    revalidatePath("/admin/berita");
    revalidatePath("/admin/dashboard");
    revalidatePath("/berita");
    revalidatePath(`/berita/${oldArticle.slug}`);

    return {
      success: true,
      error: null,
      id,
      slug: oldArticle.slug,
    };
  } catch {
    return {
      success: false,
      error: "Gagal menghapus artikel.",
    };
  }
}
