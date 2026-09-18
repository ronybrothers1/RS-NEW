import {
  eq,
  sql,
} from "drizzle-orm";
import {
  NextResponse,
} from "next/server";

import {
  deleteGoogleDriveDonationProof,
  DONATION_PROOF_MAX_SIZE,
  DONATION_PROOF_TYPES,
  isDonationProofGoogleDriveConfigured,
  isGoogleDriveDonationProofLocator,
} from "@/lib/donation-proof-media";
import {
  createDonationProofCleanupTicket,
  DONATION_PROOF_UPLOAD_TICKET_TTL_MS,
  verifyDonationProofCleanupTicket,
  verifyDonationProofUploadTicket,
} from "@/lib/donation-proof-capability";
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

function hasExpectedImageSignature(
  bytes: ArrayBuffer,
  contentType: string,
) {
  const data =
    new Uint8Array(
      bytes,
    );

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

  return false;
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


  try {
    const uploadTicket =
      request.headers
        .get(
          "x-upload-ticket",
        )
        ?.trim() ||
      "";

    const capability =
      verifyDonationProofUploadTicket(
        uploadTicket,
      );

    if (!capability) {
      throw new Error(
        "Sesi upload bukti transfer tidak valid atau sudah kedaluwarsa.",
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
    const uploadUrl =
      normalizeUploadSessionUrl(
        capability.uploadUrl,
      );

    const contentType =
      capability.contentType;

    const total =
      capability.size;

    const {
      success:
        ticketRateLimitSuccess,
      retryAfterMs:
        ticketRetryAfterMs,
    } = await rateLimit(
      "donation-proof-upload-ticket-" +
        capability.jti,
      12,
      DONATION_PROOF_UPLOAD_TICKET_TTL_MS,
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

    const start =
      parseIntegerHeader(
        request,
        "x-upload-start",
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

    if (
      start === 0 &&
      !hasExpectedImageSignature(
        bytes,
        contentType,
      )
    ) {
      throw new Error(
        "Isi bukti transfer tidak sesuai dengan format JPG atau PNG.",
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

    const locator =
      GOOGLE_DRIVE_LOCATOR_PREFIX +
      result.id;

    const cleanupTicket =
      createDonationProofCleanupTicket(
        locator,
      );

    return NextResponse.json(
      {
        complete:
          true,
        locator,
        cleanupTicket,
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
  cleanupTicket?: unknown;
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


  try {
    const body =
      (await request.json()) as
        CleanupBody;

    const locator =
      typeof body.locator ===
        "string"
        ? body.locator.trim()
        : "";

    const cleanupTicket =
      typeof body.cleanupTicket ===
        "string"
        ? body.cleanupTicket.trim()
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

    const cleanupCapability =
      verifyDonationProofCleanupTicket(
        cleanupTicket,
      );

    if (
      !cleanupCapability ||
      cleanupCapability.locator !==
        locator
    ) {
      throw new Error(
        "Izin cleanup bukti transfer tidak valid atau sudah kedaluwarsa.",
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

  const mode =
    new URL(
      request.url,
    ).searchParams.get(
      "mode",
    );

  if (
    mode !== "cleanup" &&
    mode !== "chunk"
  ) {
    return NextResponse.json(
      {
        error:
          "Mode upload bukti transfer tidak valid.",
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

  const ip =
    getClientIp(
      request.headers,
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

  return handleChunkUpload(
    request,
    ip,
  );
}