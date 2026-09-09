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

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

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
