import {
  eq,
} from "drizzle-orm";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";
import {
  getDonationProofForStaff,
} from "@/lib/donation-proof-media";
import {
  db,
} from "@/src/db";
import {
  donations,
} from "@/src/db/schema";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

function isUuid(
  value: string,
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(
  _request: Request,
  context: {
    params:
      Promise<{
        id: string;
      }>;
  },
) {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
    return new Response(
      "Unauthorized",
      {
        status: 401,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const {
    id,
  } = await context.params;

  if (!isUuid(id)) {
    return new Response(
      "Not Found",
      {
        status: 404,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  const [donation] =
    await db
      .select({
        proofImage:
          donations.proofImage,
      })
      .from(donations)
      .where(
        eq(
          donations.id,
          id,
        ),
      )
      .limit(1);

  if (
    !donation?.proofImage
  ) {
    return new Response(
      "Not Found",
      {
        status: 404,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }

  try {
    const proof =
      await getDonationProofForStaff(
        donation.proofImage,
      );

    if (!proof) {
      return new Response(
        "Not Found",
        {
          status: 404,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    return new Response(
      proof.stream,
      {
        headers: {
          "Content-Type":
            proof.contentType,
          "Cache-Control":
            "private, no-store",
          "Content-Disposition":
            "inline",
          "X-Content-Type-Options":
            "nosniff",
          "X-Robots-Tag":
            "noindex, nofollow",
        },
      },
    );
  } catch (error) {
    console.error(
      "Donation proof proxy error:",
      error,
    );

    return new Response(
      "Media unavailable",
      {
        status: 404,
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}
