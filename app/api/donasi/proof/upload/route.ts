import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import {
  NextResponse,
} from "next/server";

import {
  DONATION_PROOF_BASE_PATH,
  DONATION_PROOF_MAX_SIZE,
  DONATION_PROOF_TYPES,
  getDonationProofBlobToken,
} from "@/lib/donation-proof-media";
import {
  rateLimit,
} from "@/lib/rate-limit";

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
  const ip =
    getRequestIp(
      request,
    );

  const {
    success:
      rateLimitSuccess,
  } = rateLimit(
    `donation-proof-upload-${ip}`,
    8,
    10 * 60 * 1000,
  );

  if (
    !rateLimitSuccess
  ) {
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

  const token =
    getDonationProofBlobToken();

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Penyimpanan bukti transfer belum dikonfigurasi.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  try {
    const body =
      (await request.json()) as
        HandleUploadBody;

    const jsonResponse =
      await handleUpload({
        body,
        request,
        token,

        onBeforeGenerateToken:
          async (
            pathname,
          ) => {
            if (
              !pathname.startsWith(
                `${DONATION_PROOF_BASE_PATH}/`,
              )
            ) {
              throw new Error(
                "Lokasi bukti donasi tidak diizinkan.",
              );
            }

            return {
              allowedContentTypes:
                [
                  ...DONATION_PROOF_TYPES,
                ],
              maximumSizeInBytes:
                DONATION_PROOF_MAX_SIZE,
              addRandomSuffix:
                true,
            };
          },

        onUploadCompleted:
          async () => {
            // URL private disimpan ketika formulir donasi dikirim.
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
