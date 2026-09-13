import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import {
  NextResponse,
} from "next/server";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";
import {
  rateLimit,
} from "@/lib/rate-limit";
import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import { createVercelBlobStorage } from "@/lib/storage/providers/vercel-blob";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];


const newsBlobStorage =
  createVercelBlobStorage({
    access: "public",
  });

const NEWS_BLOB_PREFIX = "media/berita/";
const STALE_NEWS_BLOB_AGE_MS =
  7 * 24 * 60 * 60 * 1000;
const NEWS_BLOB_LIST_LIMIT = 250;

async function cleanupStaleNewsBlobOrphans() {
  const cutoff =
    Date.now() - STALE_NEWS_BLOB_AGE_MS;

  const articleReferences = await db
    .select({
      imageUrl: articles.imageUrl,
      content: articles.content,
    })
    .from(articles);

  const featuredImageUrls = new Set(
    articleReferences
      .map((article) => article.imageUrl)
      .filter((value): value is string => Boolean(value)),
  );

  const articleContents = articleReferences.map(
    (article) => article.content,
  );

  const orphanUrls = [];
  let cursor: string | undefined;

  do {
    const result = await newsBlobStorage.list({
      prefix: NEWS_BLOB_PREFIX,
      limit: NEWS_BLOB_LIST_LIMIT,
      cursor,
    });

    for (const blob of result.objects) {
      if (blob.uploadedAt.getTime() > cutoff) {
        continue;
      }

      const referencedAsFeatured =
        featuredImageUrls.has(blob.url) ||
        featuredImageUrls.has(blob.downloadUrl);

      if (referencedAsFeatured) {
        continue;
      }

      const referencedInContent =
        articleContents.some(
          (content) =>
            content.includes(blob.url) ||
            content.includes(blob.downloadUrl),
        );

      if (!referencedInContent) {
        orphanUrls.push(blob.url);
      }
    }

    cursor = result.cursor;
  } while (cursor);

  if (orphanUrls.length > 0) {
    await newsBlobStorage.delete(orphanUrls);
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
    return NextResponse.json(
      {
        error:
          "Akses pengurus diperlukan untuk mengunggah media.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const {
    success,
  } = rateLimit(
    `admin-media-upload-${staff.id}`,
    30,
    10 * 60 * 1000,
  );

  if (!success) {
    return NextResponse.json(
      {
        error:
          "Terlalu banyak permintaan upload. Silakan coba beberapa saat lagi.",
      },
      {
        status: 429,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  try {
    const body =
      (await request.json()) as HandleUploadBody;

    const jsonResponse =
      await handleUpload({
        body,
        request,

        onBeforeGenerateToken:
          async (
            pathname,
          ) => {
            if (
              !pathname.startsWith(
                "media/berita/",
              )
            ) {
              throw new Error(
                "Lokasi media tidak diizinkan.",
              );
            }

            try {
              await cleanupStaleNewsBlobOrphans();
            } catch (error) {
              console.error(
                "Gagal membersihkan orphan Blob berita lama.",
                error,
              );
            }

            return {
              allowedContentTypes:
                ALLOWED_CONTENT_TYPES,
              maximumSizeInBytes:
                MAX_IMAGE_SIZE,
              addRandomSuffix:
                true,
              tokenPayload:
                JSON.stringify({
                  userId:
                    staff.id,
                  role:
                    staff.role,
                }),
            };
          },

        onUploadCompleted:
          async () => {
            // URL Blob disimpan ketika artikel disimpan.
          },
      });

    return NextResponse.json(
      jsonResponse,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menyiapkan proses upload.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}
