import webpush from "web-push";

import {
  getNotificationRuntimeState,
  getVapidServerConfig,
} from "./config.server";

export type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SafePushMessage = {
  title: string;
  body: string;
  targetUrl?: string | null;
  tag?: string | null;
};

export type PushDeliveryStatus =
  | "disabled"
  | "misconfigured"
  | "sent"
  | "gone"
  | "failed";

export type PushDeliveryResult = {
  attempted: boolean;
  delivered: boolean;
  status: PushDeliveryStatus;
  statusCode: number | null;
};

function clampText(
  value: string,
  maxLength: number,
) {
  const clean =
    value.trim();

  if (
    clean.length <=
    maxLength
  ) {
    return clean;
  }

  return (
    `${clean.slice(
      0,
      Math.max(
        0,
        maxLength - 1,
      ),
    )}…`
  );
}

function safeTargetUrl(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "/";
  }

  if (
    !value.startsWith(
      "/",
    ) ||
    value.startsWith(
      "//",
    )
  ) {
    return "/";
  }

  return value;
}

function getStatusCode(
  error: unknown,
) {
  if (
    typeof error !==
      "object" ||
    error === null ||
    !(
      "statusCode" in
      error
    )
  ) {
    return null;
  }

  const statusCode =
    (
      error as {
        statusCode?: unknown;
      }
    ).statusCode;

  return (
    typeof statusCode ===
    "number"
      ? statusCode
      : null
  );
}

export async function sendPushBestEffort(
  subscription:
    StoredPushSubscription,
  message:
    SafePushMessage,
): Promise<PushDeliveryResult> {
  const state =
    getNotificationRuntimeState();

  if (!state.enabled) {
    return {
      attempted: false,
      delivered: false,
      status: "disabled",
      statusCode: null,
    };
  }

  const vapid =
    getVapidServerConfig();

  if (!vapid) {
    return {
      attempted: false,
      delivered: false,
      status:
        "misconfigured",
      statusCode: null,
    };
  }

  const payload =
    JSON.stringify({
      title:
        clampText(
          message.title,
          120,
        ),
      body:
        clampText(
          message.body,
          240,
        ),
      url:
        safeTargetUrl(
          message.targetUrl,
        ),
      tag:
        message.tag
          ? clampText(
              message.tag,
              80,
            )
          : undefined,
    });

  try {
    webpush.setVapidDetails(
      vapid.subject,
      vapid.publicKey,
      vapid.privateKey,
    );

    await webpush.sendNotification(
      {
        endpoint:
          subscription.endpoint,
        keys: {
          p256dh:
            subscription.p256dh,
          auth:
            subscription.auth,
        },
      },
      payload,
      {
        TTL: 300,
        urgency: "normal",
      },
    );

    return {
      attempted: true,
      delivered: true,
      status: "sent",
      statusCode: null,
    };
  } catch (error) {
    const statusCode =
      getStatusCode(
        error,
      );

    if (
      statusCode === 404 ||
      statusCode === 410
    ) {
      return {
        attempted: true,
        delivered: false,
        status: "gone",
        statusCode,
      };
    }

    return {
      attempted: true,
      delivered: false,
      status: "failed",
      statusCode,
    };
  }
}
