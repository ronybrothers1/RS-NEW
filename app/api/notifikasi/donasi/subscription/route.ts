import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  z,
} from "zod";

import {
  getClientIp,
} from "@/lib/request-ip";

import {
  rateLimit,
} from "@/lib/rate-limit";

import {
  notificationsEnabled,
} from "@/lib/notifications/config.server";

import {
  attachDonationPushSubscriptionBestEffort,
  detachDonationPushSubscriptionBestEffort,
} from "@/lib/notifications/donation-subscriptions.server";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const referenceSchema =
  z
    .string()
    .trim()
    .min(36)
    .max(80);

const capabilitySchema =
  z
    .string()
    .trim()
    .min(40)
    .max(128)
    .regex(
      /^[A-Za-z0-9_-]+$/,
    );

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
      reference:
        referenceSchema,

      capabilityToken:
        capabilitySchema,

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
      reference:
        referenceSchema,

      capabilityToken:
        capabilitySchema,

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

function sameOrigin(
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

async function allowedByRateLimit(
  request: NextRequest,
) {
  const ip =
    getClientIp(
      request.headers,
    );

  const result =
    await rateLimit(
      `donation-push-subscription-${ip}`,
      20,
      10 * 60 * 1000,
    );

  return result.success;
}

function publicFailureStatus(
  status: string,
) {
  if (
    status === "finalized"
  ) {
    return 409;
  }

  if (
    status === "unavailable"
  ) {
    return 503;
  }

  return 403;
}

function publicFailureReason(
  status: string,
) {
  if (
    status === "finalized"
  ) {
    return "donation_finalized";
  }

  if (
    status === "unavailable"
  ) {
    return "unavailable";
  }

  return "invalid_capability";
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
    !sameOrigin(
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

  if (
    !(
      await allowedByRateLimit(
        request,
      )
    )
  ) {
    return json(
      {
        ok: false,
        reason:
          "rate_limited",
      },
      429,
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
          "invalid_request",
      },
      400,
    );
  }

  const result =
    await attachDonationPushSubscriptionBestEffort({
      reference:
        parsed.data.reference,

      capabilityToken:
        parsed.data.capabilityToken,

      endpoint:
        parsed.data.endpoint,

      p256dh:
        parsed.data.keys.p256dh,

      auth:
        parsed.data.keys.auth,
    });

  if (!result.ok) {
    return json(
      {
        ok: false,
        reason:
          publicFailureReason(
            result.status,
          ),
      },
      publicFailureStatus(
        result.status,
      ),
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
    !sameOrigin(
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

  if (
    !(
      await allowedByRateLimit(
        request,
      )
    )
  ) {
    return json(
      {
        ok: false,
        reason:
          "rate_limited",
      },
      429,
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
          "invalid_request",
      },
      400,
    );
  }

  const result =
    await detachDonationPushSubscriptionBestEffort({
      reference:
        parsed.data.reference,

      capabilityToken:
        parsed.data.capabilityToken,

      endpoint:
        parsed.data.endpoint,
    });

  if (!result.ok) {
    return json(
      {
        ok: false,
        reason:
          publicFailureReason(
            result.status,
          ),
      },
      publicFailureStatus(
        result.status,
      ),
    );
  }

  return json({
    ok: true,
  });
}
