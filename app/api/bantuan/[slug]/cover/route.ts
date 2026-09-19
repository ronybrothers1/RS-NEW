import {
  and,
  eq,
  inArray,
} from "drizzle-orm";

import {
  getAssistanceBlobToken,
} from "@/lib/assistance-media";
import {
  createVercelBlobStorage,
} from "@/lib/storage/providers/vercel-blob";
import {
  db,
} from "@/src/db";
import {
  assistanceApplicationPhotos,
  campaigns,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

export async function GET(
  _request: Request,
  context: {
    params:
      Promise<{
        slug: string;
      }>;
  },
) {
  const {
    slug,
  } =
    await context.params;

  const [
    photo,
  ] =
    await db
      .select({
        imageUrl:
          assistanceApplicationPhotos.imageUrl,
      })
      .from(campaigns)
      .innerJoin(
        assistanceApplicationPhotos,
        eq(
          campaigns.coverPhotoId,
          assistanceApplicationPhotos.id,
        ),
      )
      .where(
        and(
          eq(
            campaigns.slug,
            slug,
          ),
          inArray(
            campaigns.status,
            [
              "ACTIVE",
              "COMPLETED",
            ],
          ),
          eq(
            assistanceApplicationPhotos.applicationId,
            campaigns.applicationId,
          ),
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
    const storage =
      createVercelBlobStorage({
        access: "private",
        token,
      });

    const result =
      await storage.read(
        photo.imageUrl,
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
            result.contentType,
          "Cache-Control":
            "public, max-age=3600, stale-while-revalidate=86400",
          "Vercel-CDN-Cache-Control":
            "public, max-age=3600, stale-while-revalidate=86400",
          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "Public campaign cover read error:",
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
