import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import {
  del,
} from "@vercel/blob";
import {
  eq,
} from "drizzle-orm";
import {
  NextResponse,
} from "next/server";

import {
  auth,
} from "@/auth";
import {
  rateLimit,
} from "@/lib/rate-limit";
import {
  ASSISTANCE_MEDIA_MAX_SIZE,
  ASSISTANCE_MEDIA_TYPES,
  getAssistanceBlobToken,
  isAllowedAssistanceUserPath,
} from "@/lib/assistance-media";
import {
  db,
} from "@/src/db";
import {
  users,
} from "@/src/db/schema";

async function getVerifiedPublicUser() {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  const role = (
    session?.user as
      | {
          role?: string;
        }
      | undefined
  )?.role;

  if (
    !userId ||
    role !== "USER"
  ) {
    return null;
  }

  const [user] =
    await db
      .select({
        id: users.id,
        emailVerifiedAt:
          users.emailVerifiedAt,
      })
      .from(users)
      .where(
        eq(
          users.id,
          userId,
        ),
      )
      .limit(1);

  if (
    !user ||
    !user.emailVerifiedAt
  ) {
    return null;
  }

  return user;
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  const user =
    await getVerifiedPublicUser();

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
          "Penyimpanan foto pengajuan belum dikonfigurasi.",
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

  const {
    success,
  } = rateLimit(
    `assistance-photo-upload-${user.id}`,
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
        },
      },
    );
  }

  try {
    const body =
      (await request.json()) as HandleUploadBody;

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
          async () => {
            // Metadata disimpan bersama formulir pengajuan.
          },
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
    console.error(
      "Assistance photo upload error:",
      error,
    );

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

export async function DELETE(
  request: Request,
): Promise<NextResponse> {
  const user =
    await getVerifiedPublicUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Akses tidak diizinkan.",
      },
      {
        status: 401,
      },
    );
  }

  const token =
    getAssistanceBlobToken();

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Penyimpanan foto belum dikonfigurasi.",
      },
      {
        status: 503,
      },
    );
  }

  try {
    const body =
      (await request.json()) as {
        pathname?: string;
      };

    const pathname =
      body.pathname?.trim();

    if (
      !pathname ||
      !isAllowedAssistanceUserPath(
        pathname,
        user.id,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Foto tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    await del(
      pathname,
      {
        token,
      },
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Assistance temporary photo delete error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Foto belum dapat dihapus.",
      },
      {
        status: 400,
      },
    );
  }
}
