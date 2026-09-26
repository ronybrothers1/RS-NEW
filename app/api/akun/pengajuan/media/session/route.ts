import {
  NextResponse,
} from "next/server";

import {
  getCurrentVerifiedPublicUser,
} from "@/lib/current-authz";
import {
  createAssistancePhotoUploadSession,
  ASSISTANCE_MEDIA_MAX_SIZE,
  ASSISTANCE_MEDIA_TYPES,
  isAssistanceGoogleDriveConfigured,
} from "@/lib/assistance-media";
import {
  createAssistancePhotoUploadTicket,
} from "@/lib/assistance-photo-capability";
import {
  rateLimit,
} from "@/lib/rate-limit";

export const runtime =
  "nodejs";

const allowedTypes =
  new Set<string>(
    ASSISTANCE_MEDIA_TYPES,
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
      .get("origin")
      ?.trim();

  if (!origin) {
    return false;
  }

  try {
    return (
      new URL(origin).origin ===
      new URL(request.url).origin
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
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  return `${base || "foto-pengajuan"}${extension}`;
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  const user =
    await getCurrentVerifiedPublicUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Anda harus masuk menggunakan akun yang telah diverifikasi.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      {
        error:
          "Permintaan upload foto tidak diizinkan.",
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
    retryAfterMs,
  } = await rateLimit(
    `assistance-photo-session-${user.id}`,
    25,
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
    !isAssistanceGoogleDriveConfigured()
  ) {
    return NextResponse.json(
      {
        error:
          "Penyimpanan Google Drive foto pengajuan belum dikonfigurasi.",
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
        "Nama file foto tidak valid.",
      );
    }

    if (
      !allowedTypes.has(
        contentType,
      )
    ) {
      throw new Error(
        "Foto harus berformat JPG, PNG, atau WebP.",
      );
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size >
        ASSISTANCE_MEDIA_MAX_SIZE
    ) {
      throw new Error(
        "Ukuran setiap foto maksimal 5 MB.",
      );
    }

    const uploadUrl =
      await createAssistancePhotoUploadSession({
        userId:
          user.id,
        filename:
          sanitizeFilename(
            filename,
          ),
        contentType,
        size,
      });

    const uploadTicket =
      createAssistancePhotoUploadTicket({
        userId:
          user.id,
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menyiapkan upload foto pengajuan.",
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
