import {
  NextResponse,
} from "next/server";
import {
  checkBotId,
} from "botid/server";

import {
  createDonationProofUploadSession,
  DONATION_PROOF_MAX_SIZE,
  DONATION_PROOF_TYPES,
  isDonationProofGoogleDriveConfigured,
} from "@/lib/donation-proof-media";
import {
  createDonationProofUploadTicket,
} from "@/lib/donation-proof-capability";
import {
  rateLimit,
} from "@/lib/rate-limit";
import {
  getClientIp,
} from "@/lib/request-ip";

export const runtime =
  "nodejs";

const allowedTypes =
  new Set<string>(
    DONATION_PROOF_TYPES,
  );

type UploadSessionBody = {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
};

function isSameOriginRequest(
  request: Request,
) {
  const origin =
    request.headers
      .get(
        "origin",
      )
      ?.trim();

  if (!origin) {
    return false;
  }

  try {
    return (
      new URL(origin).origin ===
      new URL(
        request.url,
      ).origin
    );
  } catch {
    return false;
  }
}

function sanitizeFilename(
  filename: string,
) {
  const extension =
    filename.includes(".")
      ? `.${filename
          .split(".")
          .pop()
          ?.toLowerCase()}`
      : "";

  const base =
    filename
      .replace(
        /\.[^/.]+$/,
        "",
      )
      .toLowerCase()
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        80,
      );

  return `${
    base ||
    "bukti-transfer"
  }${extension}`;
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  if (
    !isSameOriginRequest(
      request,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Permintaan upload bukti transfer tidak diizinkan.",
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

  const botVerification =
    await checkBotId({
      advancedOptions: {
        checkLevel:
          "basic",
      },
    });

  if (
    botVerification.isBot
  ) {
    return NextResponse.json(
      {
        error:
          "Permintaan otomatis tidak diizinkan.",
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

  const ip =
    getClientIp(
      request.headers,
    );

  const {
    success:
      rateLimitSuccess,
    retryAfterMs,
  } = await rateLimit(
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
          "Retry-After":
            String(
              Math.max(
                1,
                Math.ceil(
                  retryAfterMs /
                    1000,
                ),
              ),
            ),
        },
      },
    );
  }

  if (
    !isDonationProofGoogleDriveConfigured()
  ) {
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
        UploadSessionBody;

    const filename =
      typeof body.filename ===
        "string"
        ? body.filename.trim()
        : "";

    const contentType =
      typeof body.contentType ===
        "string"
        ? body.contentType
            .trim()
            .toLowerCase()
        : "";

    const size =
      typeof body.size ===
        "number"
        ? body.size
        : Number.NaN;

    if (!filename) {
      throw new Error(
        "Nama file bukti transfer tidak valid.",
      );
    }

    if (
      !allowedTypes.has(
        contentType,
      )
    ) {
      throw new Error(
        "Bukti transfer harus berformat JPG atau PNG.",
      );
    }

    if (
      !Number.isSafeInteger(
        size,
      ) ||
      size <= 0 ||
      size >
        DONATION_PROOF_MAX_SIZE
    ) {
      throw new Error(
        "Ukuran bukti transfer maksimal 5 MB.",
      );
    }

    const safeName =
      sanitizeFilename(
        filename,
      );

    const uploadUrl =
      await createDonationProofUploadSession({
        filename:
          `${Date.now()}-${safeName}`,
        contentType,
        size,
      });

    const uploadTicket =
      createDonationProofUploadTicket({
        uploadUrl,
        contentType,
        size,
      });

    return NextResponse.json(
      {
        uploadTicket,
      },
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
        error:
          message,
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