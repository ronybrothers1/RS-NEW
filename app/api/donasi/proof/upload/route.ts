import {
  eq,
  sql,
} from "drizzle-orm";
import {
  NextResponse,
} from "next/server";

import {
  createDonationProofUploadSession,
  deleteGoogleDriveDonationProof,
  DONATION_PROOF_MAX_SIZE,
  DONATION_PROOF_TYPES,
  isDonationProofGoogleDriveConfigured,
  isGoogleDriveDonationProofLocator,
} from "@/lib/donation-proof-media";
import {
  GOOGLE_DRIVE_LOCATOR_PREFIX,
} from "@/lib/storage/providers/google-drive";
import {
  rateLimit,
} from "@/lib/rate-limit";
import {
  getClientIp,
} from "@/lib/request-ip";
import {
  db,
} from "@/src/db";
import {
  donations,
} from "@/src/db/schema";

export const runtime =
  "nodejs";

const allowedTypes =
  new Set<string>(
    DONATION_PROOF_TYPES,
  );

const DRIVE_UPLOAD_HOST =
  "www.googleapis.com";

const DRIVE_UPLOAD_PATH =
  "/upload/drive/v3/files";

const CHUNK_SIZE =
  1024 * 1024;

const CHUNK_ALIGNMENT =
  256 * 1024;

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

function parseIntegerHeader(
  request: Request,
  name: string,
) {
  const value =
    request.headers.get(
      name,
    );

  if (
    !value ||
    !/^\d+$/.test(
      value,
    )
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
  value: string | null,
) {
  if (!value) {
    throw new Error(
      "Sesi upload Google Drive tidak tersedia.",
    );
  }

  const url =
    new URL(value);

  if (
    url.protocol !==
      "https:" ||
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
    Number(
      match[1],
    );

  return Number.isSafeInteger(
    end,
  )
    ? end
    : null;
}

async function handleChunkUpload(
  request: Request,
  ip: string,
) {
  const {
    success:
      rateLimitSuccess,
    retryAfterMs,
  } = await rateLimit(
    `donation-proof-upload-chunk-${ip}`,
    48,
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
    const uploadUrl =
      normalizeUploadSessionUrl(
        request.headers.get(
          "x-upload-session",
        ),
      );

    const contentType =
      request.headers
        .get(
          "x-upload-content-type",
        )
        ?.trim()
        .toLowerCase() ||
      "";

    const start =
      parseIntegerHeader(
        request,
        "x-upload-start",
      );

    const total =
      parseIntegerHeader(
        request,
        "x-upload-total",
      );

    if (
      !allowedTypes.has(
        contentType,
      )
    ) {
      throw new Error(
        "Format bukti transfer tidak valid.",
      );
    }

    if (
      start === null ||
      total === null ||
      total <= 0 ||
      total >
        DONATION_PROOF_MAX_SIZE ||
      start < 0 ||
      start >= total ||
      start %
        CHUNK_ALIGNMENT !==
        0
    ) {
      throw new Error(
        "Rentang upload bukti transfer tidak valid.",
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

    const end =
      start +
      length -
      1;

    if (end >= total) {
      throw new Error(
        "Rentang upload melebihi ukuran file.",
      );
    }

    const isFinal =
      end ===
      total - 1;

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
          method:
            "PUT",
          headers: {
            "Content-Type":
              contentType,
            "Content-Length":
              String(length),
            "Content-Range":
              `bytes ${start}-${end}/${total}`,
          },
          body:
            bytes,
          cache:
            "no-store",
        },
      );

    if (
      response.status ===
      308
    ) {
      const acknowledgedEnd =
        readAcknowledgedEnd(
          response.headers.get(
            "range",
          ),
        );

      if (
        acknowledgedEnd !==
          null &&
        acknowledgedEnd <
          end
      ) {
        throw new Error(
          "Google Drive belum menerima seluruh potongan file.",
        );
      }

      return NextResponse.json(
        {
          complete:
            false,
          nextStart:
            (acknowledgedEnd ??
              end) +
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
        "Google Drive donation chunk upload failed:",
        response.status,
        await response
          .text()
          .catch(
            () => "",
          ),
      );

      return NextResponse.json(
        {
          error:
            "Google Drive gagal menerima bukti transfer.",
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

    return NextResponse.json(
      {
        complete:
          true,
        fileId:
          result.id,
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
        : "Gagal mengunggah bukti transfer.";

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

type CleanupBody = {
  locator?: unknown;
};

async function handleCleanup(
  request: Request,
  ip: string,
) {
  const {
    success:
      rateLimitSuccess,
    retryAfterMs,
  } = await rateLimit(
    `donation-proof-cleanup-${ip}`,
    24,
    10 * 60 * 1000,
  );

  if (!rateLimitSuccess) {
    return NextResponse.json(
      {
        error:
          "Terlalu banyak permintaan cleanup. Silakan coba beberapa saat lagi.",
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
        CleanupBody;

    const locator =
      typeof body.locator ===
        "string"
        ? body.locator.trim()
        : "";

    if (
      !isGoogleDriveDonationProofLocator(
        locator,
      )
    ) {
      throw new Error(
        "Bukti transfer yang akan dihapus tidak valid.",
      );
    }

    const outcome =
      await db.transaction(
        async (tx) => {
          await tx.execute(
            sql`SELECT pg_advisory_xact_lock(hashtext(${locator}))`,
          );

          const [
            existingProof,
          ] =
            await tx
              .select({
                id:
                  donations.id,
              })
              .from(
                donations,
              )
              .where(
                eq(
                  donations.proofImage,
                  locator,
                ),
              )
              .limit(1);

          if (
            existingProof
          ) {
            return "preserved";
          }

          await deleteGoogleDriveDonationProof(
            locator,
          );

          return "deleted";
        },
      );

    if (
      outcome ===
      "preserved"
    ) {
      return NextResponse.json(
        {
          error:
            "Bukti transfer sudah tercatat pada donasi dan tidak boleh dihapus.",
          preserved:
            true,
        },
        {
          status: 409,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        deleted: true,
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
        : "Gagal membersihkan bukti transfer.";

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

type UploadSessionBody = {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
};

async function handleUploadSession(
  request: Request,
  ip: string,
) {
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

    return NextResponse.json(
      {
        uploadUrl,
        locatorPrefix:
          GOOGLE_DRIVE_LOCATOR_PREFIX,
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

export async function POST(
  request: Request,
): Promise<NextResponse> {
  const ip =
    getClientIp(
      request.headers,
    );

  const mode =
    new URL(
      request.url,
    ).searchParams.get(
      "mode",
    );

  if (
    mode ===
    "cleanup"
  ) {
    return handleCleanup(
      request,
      ip,
    );
  }

  if (
    mode ===
    "chunk"
  ) {
    return handleChunkUpload(
      request,
      ip,
    );
  }

  return handleUploadSession(
    request,
    ip,
  );
}
