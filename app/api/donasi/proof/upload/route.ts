import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
];

function getRequestIp(
  request: Request,
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for",
    );

  return (
    forwardedFor
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip",
    ) ||
    "unknown-ip"
  );
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  const ip = getRequestIp(
    request,
  );

  const {
    success: rateLimitSuccess,
  } = rateLimit(
    `donation-proof-upload-${ip}`,
    8,
    10 * 60 * 1000,
  );

  if (!rateLimitSuccess) {
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
          async (pathname) => {
            if (
              !pathname.startsWith(
                "media/donasi/",
              )
            ) {
              throw new Error(
                "Lokasi bukti donasi tidak diizinkan.",
              );
            }

            return {
              allowedContentTypes:
                ALLOWED_CONTENT_TYPES,
              maximumSizeInBytes:
                MAX_IMAGE_SIZE,
              addRandomSuffix: true,
            };
          },

        onUploadCompleted:
          async () => {
            // URL Blob disimpan saat
            // formulir donasi dikirim.
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
        : "Gagal menyiapkan upload bukti transfer.";

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