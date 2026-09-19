"use server";

import { getCurrentStaffUser } from "@/lib/current-authz";
import { db } from "@/src/db";
import { articles, auditLogs, programs } from "@/src/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { hasMeaningfulArticleContent } from "@/lib/article-content";
import {
  PUBLIC_ARTICLES_CACHE_TAG,
} from "@/lib/public-articles";
import { createVercelBlobStorage } from "@/lib/storage/providers/vercel-blob";

type ArticleStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

type ActionResult = {
  success: boolean;
  error: string | null;
  id?: string;
  slug?: string;
};

const CREATE_STATUSES: ArticleStatus[] = [
  "DRAFT",
  "PUBLISHED",
];

const UPDATE_STATUSES: ArticleStatus[] = [
  "DRAFT",
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const newsBlobStorage =
  createVercelBlobStorage({
    access: "public",
  });

function isManagedNewsBlobUrl(value: string | null): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".blob.vercel-storage.com") &&
      url.pathname.startsWith("/media/berita/")
    );
  } catch {
    return false;
  }
}

async function deleteUnusedNewsBlob(value: string | null) {
  if (!isManagedNewsBlobUrl(value)) return;

  try {
    const [reference] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.imageUrl, value))
      .limit(1);

    if (reference) return;

    await newsBlobStorage.delete(value);
  } catch (error) {
    console.error(
      "Gagal membersihkan Blob gambar berita yang tidak lagi digunakan.",
      error,
    );
  }
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

async function getEditorUser() {
  return getCurrentStaffUser();
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
  const staff = await getEditorUser();

  if (!staff) {
    return {
      success: false,
      error: "Anda tidak memiliki akses untuk membuat berita.",
    };
  }

  const title = cleanOptional(formData.get("title"));
  const rawContent = cleanOptional(formData.get("content"));
  const programId = cleanOptional(formData.get("programId"));

  if (!title || !rawContent) {
    return {
      success: false,
      error: "Judul dan konten wajib diisi.",
    };
  }

  if (programId && !isUuid(programId)) {
    return {
      success: false,
      error: "Program berita yang dipilih tidak valid.",
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
        programId,
        status,
        authorId: staff.id,
        updatedAt: new Date(),
        ...lifecycle,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: staff.id,
      action: status === "PUBLISHED" ? "PUBLISH" : "CREATE",
      tableName: "articles",
      recordId: newArticle.id,
      newData: newArticle,
    });

    revalidateTag(PUBLIC_ARTICLES_CACHE_TAG);
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
  const staff = await getEditorUser();

  if (!staff) {
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
  const programId = cleanOptional(formData.get("programId"));

  if (!title || !rawContent) {
    return {
      success: false,
      error: "Judul dan konten wajib diisi.",
    };
  }

  if (programId && !isUuid(programId)) {
    return {
      success: false,
      error: "Program berita yang dipilih tidak valid.",
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
        programId,
        status,
        updatedAt: new Date(),
        ...lifecycle,
      })
      .where(eq(articles.id, id))
      .returning();

    await db.insert(auditLogs).values({
      userId: staff.id,
      action: getAuditAction(oldArticle.status, status),
      tableName: "articles",
      recordId: id,
      oldData: oldArticle,
      newData: updatedArticle,
    });

    if (oldArticle.imageUrl !== updatedArticle.imageUrl) {
      await deleteUnusedNewsBlob(oldArticle.imageUrl);
    }

    revalidateTag(PUBLIC_ARTICLES_CACHE_TAG);
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

export async function updateBeritaProgram(
  id: string,
  programId: string | null,
): Promise<ActionResult> {
  const staff =
    await getEditorUser();

  if (!staff) {
    return {
      success: false,
      error:
        "Anda tidak memiliki akses untuk mengubah program berita.",
    };
  }

  if (!isUuid(id)) {
    return {
      success: false,
      error: "Artikel tidak valid.",
    };
  }

  const normalizedProgramId =
    typeof programId === "string" &&
    programId.trim()
      ? programId.trim()
      : null;

  if (
    normalizedProgramId &&
    !isUuid(normalizedProgramId)
  ) {
    return {
      success: false,
      error:
        "Program berita yang dipilih tidak valid.",
    };
  }

  try {
    const outcome =
      await db.transaction(
        async (
          tx,
        ): Promise<{
          result: ActionResult;
          slug: string | null;
          changed: boolean;
        }> => {
          const [oldArticle] =
            await tx
              .select()
              .from(articles)
              .where(
                eq(
                  articles.id,
                  id,
                ),
              )
              .limit(1);

          if (!oldArticle) {
            return {
              result: {
                success: false,
                error:
                  "Artikel tidak ditemukan.",
              },
              slug: null,
              changed: false,
            };
          }

          if (
            oldArticle.programId ===
            normalizedProgramId
          ) {
            return {
              result: {
                success: true,
                error: null,
                id,
                slug:
                  oldArticle.slug,
              },
              slug:
                oldArticle.slug,
              changed: false,
            };
          }

          if (
            normalizedProgramId
          ) {
            const [
              selectedProgram,
            ] =
              await tx
                .select({
                  id:
                    programs.id,
                  status:
                    programs.status,
                })
                .from(programs)
                .where(
                  eq(
                    programs.id,
                    normalizedProgramId,
                  ),
                )
                .limit(1);

            if (
              !selectedProgram ||
              selectedProgram.status !==
                "ACTIVE"
            ) {
              return {
                result: {
                  success: false,
                  error:
                    "Program tidak ditemukan atau sudah tidak aktif.",
                },
                slug:
                  oldArticle.slug,
                changed: false,
              };
            }
          }

          const currentProgramGuard =
            oldArticle.programId
              ? eq(
                  articles.programId,
                  oldArticle.programId,
                )
              : isNull(
                  articles.programId,
                );

          const [
            updatedArticle,
          ] =
            await tx
              .update(articles)
              .set({
                programId:
                  normalizedProgramId,
              })
              .where(
                and(
                  eq(
                    articles.id,
                    id,
                  ),
                  currentProgramGuard,
                ),
              )
              .returning();

          if (!updatedArticle) {
            return {
              result: {
                success: false,
                error:
                  "Label program berubah dari sesi lain. Muat ulang halaman lalu coba kembali.",
              },
              slug:
                oldArticle.slug,
              changed: false,
            };
          }

          await tx
            .insert(auditLogs)
            .values({
              userId:
                staff.id,
              action:
                "UPDATE",
              tableName:
                "articles",
              recordId:
                id,
              oldData:
                oldArticle,
              newData:
                updatedArticle,
            });

          return {
            result: {
              success: true,
              error: null,
              id,
              slug:
                updatedArticle.slug,
            },
            slug:
              updatedArticle.slug,
            changed: true,
          };
        },
      );

    if (
      !outcome.result.success ||
      !outcome.changed
    ) {
      return outcome.result;
    }

    revalidateTag(
      PUBLIC_ARTICLES_CACHE_TAG,
    );

    revalidatePath(
      "/admin/berita",
    );

    revalidatePath(
      `/admin/berita/${id}/edit`,
    );

    revalidatePath(
      "/berita",
    );

    if (outcome.slug) {
      revalidatePath(
        `/berita/${outcome.slug}`,
      );
    }

    return outcome.result;
  } catch {
    return {
      success: false,
      error:
        "Gagal memperbarui label program berita.",
    };
  }
}

export async function archiveBerita(
  id: string,
): Promise<ActionResult> {
  const staff = await getEditorUser();

  if (!staff) {
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
    userId: staff.id,
    action: "ARCHIVE",
    tableName: "articles",
    recordId: id,
    oldData: oldArticle,
    newData: updatedArticle,
  });

  revalidateTag(PUBLIC_ARTICLES_CACHE_TAG);
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
  const staff = await getEditorUser();

  if (!staff) {
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
      userId: staff.id,
      action: "DELETE",
      tableName: "articles",
      recordId: id,
      oldData: oldArticle,
    });

    await deleteUnusedNewsBlob(oldArticle.imageUrl);

    revalidateTag(PUBLIC_ARTICLES_CACHE_TAG);
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
