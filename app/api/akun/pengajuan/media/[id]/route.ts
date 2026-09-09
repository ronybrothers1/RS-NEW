import {
  get,
} from "@vercel/blob";
import {
  eq,
} from "drizzle-orm";

import {
  auth,
} from "@/auth";
import {
  getAssistanceBlobToken,
} from "@/lib/assistance-media";
import {
  db,
} from "@/src/db";
import {
  assistanceApplicationPhotos,
  assistanceApplications,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

export async function GET(
  _request: Request,
  context: {
    params:
      Promise<{
        id: string;
      }>;
  },
) {
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

  if (!userId) {
    return new Response(
      "Unauthorized",
      {
        status: 401,
      },
    );
  }

  const {
    id,
  } = await context.params;

  const [photo] =
    await db
      .select({
        imageUrl:
          assistanceApplicationPhotos.imageUrl,
        applicantId:
          assistanceApplications.applicantId,
      })
      .from(
        assistanceApplicationPhotos,
      )
      .innerJoin(
        assistanceApplications,
        eq(
          assistanceApplicationPhotos.applicationId,
          assistanceApplications.id,
        ),
      )
      .where(
        eq(
          assistanceApplicationPhotos.id,
          id,
        ),
      )
      .limit(1);

  if (!photo) {
    return new Response(
      "Not Found",
      {
        status: 404,
      },
    );
  }

  const isStaff =
    role === "ADMIN" ||
    role === "OPERATOR";

  const isOwner =
    role === "USER" &&
    photo.applicantId ===
      userId;

  if (
    !isStaff &&
    !isOwner
  ) {
    return new Response(
      "Forbidden",
      {
        status: 403,
      },
    );
  }

  const token =
    getAssistanceBlobToken();

  if (!token) {
    return new Response(
      "Media storage unavailable",
      {
        status: 503,
      },
    );
  }

  try {
    const result =
      await get(
        photo.imageUrl,
        {
          access:
            "private",
          token,
        },
      );

    if (!result) {
      return new Response(
        "Not Found",
        {
          status: 404,
        },
      );
    }

    return new Response(
      result.stream,
      {
        headers: {
          "Content-Type":
            result.blob
              .contentType ||
            "application/octet-stream",
          "Cache-Control":
            "private, no-store",
          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "Private assistance media read error:",
      error,
    );

    return new Response(
      "Media unavailable",
      {
        status: 404,
      },
    );
  }
}
