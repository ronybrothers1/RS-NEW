import {
  sql,
} from "drizzle-orm";
import {
  NextResponse,
} from "next/server";

import {
  db,
} from "@/src/db";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const noStoreHeaders = {
  "Cache-Control":
    "no-store, max-age=0",
  "X-Robots-Tag":
    "noindex, nofollow",
};

export async function GET() {
  const startedAt =
    Date.now();

  try {
    await db.execute(
      sql`SELECT 1 AS ok`,
    );

    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        checkedAt:
          new Date().toISOString(),
        latencyMs:
          Date.now() -
          startedAt,
      },
      {
        status: 200,
        headers:
          noStoreHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Health check database error:",
      error,
    );

    return NextResponse.json(
      {
        status:
          "degraded",
        database:
          "unavailable",
        checkedAt:
          new Date().toISOString(),
      },
      {
        status: 503,
        headers:
          noStoreHeaders,
      },
    );
  }
}
