import {
  NextResponse,
} from "next/server";

import {
  getNotificationRuntimeState,
} from "@/lib/notifications/config.server";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export async function GET() {
  const state =
    getNotificationRuntimeState();

  return NextResponse.json(
    {
      enabled:
        state.enabled,
      ready:
        state.ready,
      publicKey:
        state.enabled &&
        state.ready
          ? state.publicKey
          : null,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
