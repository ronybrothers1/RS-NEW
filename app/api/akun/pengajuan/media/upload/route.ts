import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import {
  NextResponse,
} from "next/server";

import {
  getCurrentVerifiedPublicUser,
} from "@/lib/current-authz";
import {
  ASSISTANCE_MEDIA_MAX_SIZE,
  ASSISTANCE_MEDIA_TYPES,
  deleteAssistancePhoto,
  getAssistanceBlobToken,
  getGoogleDriveAssistanceStoragePath,
  isAllowedAssistanceUserPath,
} from "@/lib/assistance-media";
import {
  ASSISTANCE_PHOTO_UPLOAD_TICKET_TTL_MS,
  verifyAssistancePhotoUploadTicket,
} from "@/lib/assistance-photo-capability";
import {
  rateLimit,
} from "@/lib/rate-limit";
import {
  GOOGLE_DRIVE_LOCATOR_PREFIX,
} from "@/lib/storage/providers/google-drive";
import {
  createVercelBlobStorage,
} from "@/lib/storage/providers/vercel-blob";

export const runtime =
  "nodejs";

const allowedTypes =
  new Set<string>(
    ASSISTANCE_MEDIA_TYPES,
  );

const DRIVE_UPLOAD_HOST =
  "www.googleapis.com";

const DRIVE_UPLOAD_PATH =
  "/upload/drive/v3/files";

const CHUNK_SIZE =
  1024 * 1024;

const CHUNK_ALIGNMENT =
  256 * 1024;

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

function parseIntegerHeader(
  request: Request,
  name: string,
) {
  const value =
    request.headers.get(name);

  if (
    !value ||
    !/^\d+$/.test(value)
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isSafeInteger(
    parsed,
  )
    ? parsed
    : null;
}

function normalizeUploadSessionUrl(
  value: string,
) {
  const url =
    new URL(value);

  if (
    url.protocol !== "https:" ||
    url.hostname !==
      DRIVE_UPLOAD_HOST ||
    url.pathname !==
      DRIVE_UPLOAD_PATH ||
    url.searchParams.get(
      "uploadType",
    ) !== "resumable" ||
    !url.searchParams.get(
      "upload_id",
    )
  ) {
    throw new Error(
      "Sesi upload Google Drive tidak valid.",
    );
  }

  return url.toString();
}

function readAcknowledgedEnd(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const match =
    /^bytes=0-(\d+)$/.exec(
      value.trim(),
    );

  if (!match) {
    return null;
  }

  const end =
    Number(match[1]);

  return Number.isSafeInteger(end)
    ? end
    : null;
}

function hasExpectedImageSignature(
  bytes: ArrayBuffer,
  contentType: string,
) {
  const data =
    new Uint8Array(bytes);

  if (
    contentType ===
    "image/jpeg"
  ) {
    return (
      data.length >= 3 &&
      data[0] === 0xff &&
      data[1] === 0xd8 &&
      data[2] === 0xff
    );
  }

  if (
    contentType ===
    "image/png"
  ) {
    return (
      data.length >= 8 &&
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    );
  }

  if (
    contentType ===
    "image/webp"
  ) {
    return (
      data.length >= 12 &&
      data[0] === 0x52 &&
      data[1] === 0x49 &&
      data[2] === 0x46 &&
      data[3] === 0x46 &&
      data[8] === 0x57 &&
      data[9] === 0x45 &&
      data[10] === 0x42 &&
      data[11] === 0x50
    );
  }

  return false;
}

async function handleDriveChunkUpload(
  request: Request,
) {
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
    `assistance-photo-chunk-${user.id}`,
    60,
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

  try {
    const uploadTicket =
      request.headers
        .get("x-upload-ticket")
        ?.trim() || "";

    const capability =
      verifyAssistancePhotoUploadTicket(
        uploadTicket,
      );

    if (
      !capability ||
      capability.userId !==
        user.id
    ) {
      throw new Error(
        "Sesi upload foto tidak valid atau sudah kedaluwarsa.",
      );
    }

    const {
      success:
        ticketRateLimitSuccess,
      retryAfterMs:
        ticketRetryAfterMs,
    } = await rateLimit(
      `assistance-photo-ticket-${capability.jti}`,
      12,
      ASSISTANCE_PHOTO_UPLOAD_TICKET_TTL_MS,
    );

    if (
      !ticketRateLimitSuccess
    ) {
      return NextResponse.json(
        {
          error:
            "Sesi upload terlalu sering digunakan. Silakan mulai ulang unggahan.",
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
                    ticketRetryAfterMs /
                      1000,
                  ),
                ),
              ),
          },
        },
      );
    }

    const uploadUrl =
      normalizeUploadSessionUrl(
        capability.uploadUrl,
      );

    const contentType =
      capability.contentType;
    const total =
      capability.size;
    const start =
      parseIntegerHeader(
        request,
        "x-upload-start",
      );

    if (
      !allowedTypes.has(
        contentType,
      ) ||
      start === null ||
      total <= 0 ||
      total >
        ASSISTANCE_MEDIA_MAX_SIZE ||
      start < 0 ||
      start >= total ||
      start %
        CHUNK_ALIGNMENT !==
        0
    ) {
      throw new Error(
        "Rentang upload foto tidak valid.",
      );
    }

    const bytes =
      await request.arrayBuffer();
    const length =
      bytes.byteLength;

    if (
      length <= 0 ||
      length > CHUNK_SIZE
    ) {
      throw new Error(
        "Ukuran potongan upload tidak valid.",
      );
    }

    if (
      start === 0 &&
      !hasExpectedImageSignature(
        bytes,
        contentType,
      )
    ) {
      throw new Error(
        "Isi file tidak sesuai dengan format gambar yang dipilih.",
      );
    }

    const end =
      start + length - 1;

    if (end >= total) {
      throw new Error(
        "Rentang upload melebihi ukuran file.",
      );
    }

    const isFinal =
      end === total - 1;

    if (
      !isFinal &&
      length %
        CHUNK_ALIGNMENT !==
        0
    ) {
      throw new Error(
        "Ukuran potongan upload tidak valid.",
      );
    }

    const response =
      await fetch(
        uploadUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              contentType,
            "Content-Length":
              String(length),
            "Content-Range":
              `bytes ${start}-${end}/${total}`,
          },
          body: bytes,
          cache: "no-store",
        },
      );

    if (
      response.status === 308
    ) {
      const acknowledgedEnd =
        readAcknowledgedEnd(
          response.headers.get(
            "range",
          ),
        );

      if (
        acknowledgedEnd !== null &&
        acknowledgedEnd < end
      ) {
        throw new Error(
          "Google Drive belum menerima seluruh potongan file.",
        );
      }

      return NextResponse.json(
        {
          complete: false,
          nextStart:
            (acknowledgedEnd ?? end) +
            1,
        },
        {
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    if (!response.ok) {
      console.error(
        "Google Drive assistance chunk upload failed:",
        response.status,
        await response
          .text()
          .catch(() => ""),
      );

      return NextResponse.json(
        {
          error:
            "Google Drive gagal menerima foto pengajuan.",
        },
        {
          status: 502,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const result =
      (await response.json()) as {
        id?: unknown;
      };

    if (
      typeof result.id !==
        "string" ||
      !/^[A-Za-z0-9_-]+$/.test(
        result.id,
      )
    ) {
      throw new Error(
        "Google Drive tidak mengembalikan file ID yang valid.",
      );
    }

    const value =
      GOOGLE_DRIVE_LOCATOR_PREFIX +
      result.id;

    return NextResponse.json(
      {
        complete: true,
        url: value,
        pathname:
          getGoogleDriveAssistanceStoragePath(
            user.id,
            value,
          ),
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
            : "Gagal mengunggah foto pengajuan.",
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

async function handleLegacyBlobUpload(
  request: Request,
) {
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

  const token =
    getAssistanceBlobToken();

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Penyimpanan foto lama belum dikonfigurasi.",
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

    const result =
      await handleUpload({
        body,
        request,
        token,
        onBeforeGenerateToken:
          async (pathname) => {
            if (
              !isAllowedAssistanceUserPath(
                pathname,
                user.id,
              )
            ) {
              throw new Error(
                "Lokasi foto pengajuan tidak diizinkan.",
              );
            }

            return {
              allowedContentTypes:
                [
                  ...ASSISTANCE_MEDIA_TYPES,
                ],
              maximumSizeInBytes:
                ASSISTANCE_MEDIA_MAX_SIZE,
              addRandomSuffix: true,
            };
          },
        onUploadCompleted:
          async () => undefined,
      });

    return NextResponse.json(
      result,
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
            : "Gagal mengunggah foto pengajuan.",
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

export async function POST(
  request: Request,
): Promise<NextResponse> {
  const mode =
    new URL(request.url)
      .searchParams.get("mode");

  if (mode === "chunk") {
    return handleDriveChunkUpload(
      request,
    );
  }

  return handleLegacyBlobUpload(
    request,
  );
}

export async function DELETE(
  request: Request,
): Promise<NextResponse> {
  const user =
    await getCurrentVerifiedPublicUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Akses tidak diizinkan.",
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

  try {
    const body =
      (await request.json()) as {
        url?: unknown;
        pathname?: unknown;
      };

    const value =
      typeof body.url ===
        "string"
        ? body.url.trim()
        : "";

    const pathname =
      typeof body.pathname ===
        "string"
        ? body.pathname.trim()
        : "";

    if (value) {
      await deleteAssistancePhoto({
        value,
        pathname,
        userId:
          user.id,
      });
    } else {
      if (
        !pathname ||
        !isAllowedAssistanceUserPath(
          pathname,
          user.id,
        )
      ) {
        throw new Error(
          "Foto tidak valid.",
        );
      }

      const token =
        getAssistanceBlobToken();

      if (!token) {
        throw new Error(
          "Penyimpanan foto lama belum tersedia.",
        );
      }

      const storage =
        createVercelBlobStorage({
          access: "private",
          token,
        });

      await storage.delete(
        pathname,
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Assistance temporary photo delete error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Foto belum dapat dihapus.",
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
