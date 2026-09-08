import { auth } from "@/auth";
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();

        if (!session?.user?.id) {
          throw new Error("Anda harus login untuk mengunggah media.");
        }

        if (!pathname.startsWith("media/berita/")) {
          throw new Error("Lokasi media tidak diizinkan.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        };
      },

      onUploadCompleted: async () => {
        // URL Blob disimpan ketika artikel disimpan.
        // Callback disediakan untuk ekspansi Media Library berikutnya.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menyiapkan proses upload.";

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}