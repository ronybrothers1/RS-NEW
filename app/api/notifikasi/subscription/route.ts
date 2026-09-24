import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  z,
} from "zod";

import {
  getCurrentDbUser,
} from "@/lib/current-authz";

import {
  notificationsEnabled,
} from "@/lib/notifications/config.server";

import {
  deactivateUserPushSubscription,
  upsertUserPushSubscription,
} from "@/lib/notifications/subscriptions.server";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const endpointSchema =
  z
    .string()
    .trim()
    .min(20)
    .max(4096)
    .url()
    .refine(
      (value) =>
        value.startsWith(
          "https://",
        ),
      {
        message:
          "Endpoint must use HTTPS",
      },
    );

const subscribeSchema =
  z
    .object({
      endpoint:
        endpointSchema,

      keys:
        z
          .object({
            p256dh:
              z
                .string()
                .trim()
                .min(20)
                .max(1024),

            auth:
              z
                .string()
                .trim()
                .min(8)
                .max(512),
          })
          .strict(),
    })
    .strict();

const unsubscribeSchema =
  z
    .object({
      endpoint:
        endpointSchema,
    })
    .strict();

function json(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

function hasSameOrigin(
  request: NextRequest,
) {
  const origin =
    request.headers.get(
      "origin",
    );

  if (!origin) {
    return false;
  }

  try {
    return (
      new URL(
        origin,
      ).origin ===
      request.nextUrl.origin
    );
  } catch {
    return false;
  }
}

async function getAuthorizedUser() {
  const user =
    await getCurrentDbUser();

  if (!user) {
    return null;
  }

  if (
    user.role === "USER" &&
    !user.emailVerifiedAt
  ) {
    return null;
  }

  return user;
}

export async function POST(
  request: NextRequest,
) {
  if (
    !notificationsEnabled()
  ) {
    return json(
      {
        ok: false,
        reason:
          "disabled",
      },
      503,
    );
  }

  if (
    !hasSameOrigin(
      request,
    )
  ) {
    return json(
      {
        ok: false,
        reason:
          "invalid_origin",
      },
      403,
    );
  }

  const user =
    await getAuthorizedUser();

  if (!user) {
    return json(
      {
        ok: false,
        reason:
          "unauthorized",
      },
      401,
    );
  }

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return json(
      {
        ok: false,
        reason:
          "invalid_json",
      },
      400,
    );
  }

  const parsed =
    subscribeSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return json(
      {
        ok: false,
        reason:
          "invalid_subscription",
      },
      400,
    );
  }

  const result =
    await upsertUserPushSubscription(
      user.id,
      {
        endpoint:
          parsed.data.endpoint,
        p256dh:
          parsed.data.keys.p256dh,
        auth:
          parsed.data.keys.auth,
      },
    );

  if (!result.ok) {
    return json(
      {
        ok: false,
        reason:
          result.reason,
      },
      503,
    );
  }

  return json({
    ok: true,
  });
}

export async function DELETE(
  request: NextRequest,
) {
  if (
    !notificationsEnabled()
  ) {
    return json(
      {
        ok: false,
        reason:
          "disabled",
      },
      503,
    );
  }

  if (
    !hasSameOrigin(
      request,
    )
  ) {
    return json(
      {
        ok: false,
        reason:
          "invalid_origin",
      },
      403,
    );
  }

  const user =
    await getAuthorizedUser();

  if (!user) {
    return json(
      {
        ok: false,
        reason:
          "unauthorized",
      },
      401,
    );
  }

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return json(
      {
        ok: false,
        reason:
          "invalid_json",
      },
      400,
    );
  }

  const parsed =
    unsubscribeSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return json(
      {
        ok: false,
        reason:
          "invalid_subscription",
      },
      400,
    );
  }

  const result =
    await deactivateUserPushSubscription(
      user.id,
      parsed.data.endpoint,
    );

  if (!result.ok) {
    return json(
      {
        ok: false,
        reason:
          result.reason,
      },
      503,
    );
  }

  return json({
    ok: true,
  });
}
