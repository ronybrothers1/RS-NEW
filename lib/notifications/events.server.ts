import {
  eq,
  or,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";

import {
  notifications,
  users,
} from "@/src/db/schema";

import {
  notificationsEnabled,
} from "./config.server";

import {
  deliverPushToUserBestEffort,
} from "./delivery.server";

import type {
  UserPushDeliveryResult,
} from "./delivery.server";

export const NOTIFICATION_EVENT_TYPES = {
  donationSubmitted:
    "DONATION_SUBMITTED",

  donationVerified:
    "DONATION_VERIFIED",

  donationRejected:
    "DONATION_REJECTED",

  assistanceSubmitted:
    "ASSISTANCE_SUBMITTED",

  assistanceNeedsRevision:
    "ASSISTANCE_NEEDS_REVISION",

  assistanceApproved:
    "ASSISTANCE_APPROVED",

  assistanceRejected:
    "ASSISTANCE_REJECTED",

  assistanceScheduled:
    "ASSISTANCE_SCHEDULED",

  assistanceCompleted:
    "ASSISTANCE_COMPLETED",
} as const;

export type NotificationEventType =
  (
    typeof NOTIFICATION_EVENT_TYPES
  )[
    keyof typeof NOTIFICATION_EVENT_TYPES
  ];

export type NotificationEventInput = {
  userId: string;
  type: NotificationEventType;
  title: string;
  body: string;
  targetUrl?: string | null;
  dedupeKey?: string | null;
};

export type NotificationEventResult = {
  ok: boolean;
  status:
    | "disabled"
    | "created"
    | "deduped"
    | "invalid"
    | "unavailable";
  notificationId: string | null;
  push: UserPushDeliveryResult | null;
};

export type StaffNotificationResult = {
  enabled: boolean;
  available: boolean;
  recipients: number;
  created: number;
  deduped: number;
  failed: number;
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

function safeInternalTarget(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

  if (
    !value.startsWith(
      "/",
    ) ||
    value.startsWith(
      "//",
    )
  ) {
    return null;
  }

  return value;
}

function normalizeDedupeKey(
  value:
    | string
    | null
    | undefined,
) {
  const clean =
    value?.trim();

  if (!clean) {
    return null;
  }

  if (
    clean.length >
    240
  ) {
    return null;
  }

  return clean;
}

function logEventFailure(
  operation: string,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "unknown_error";

  console.error(
    `[notifications] ${operation} failed: ${message}`,
  );
}

export async function createUserNotificationEventBestEffort(
  input: NotificationEventInput,
): Promise<NotificationEventResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      ok: false,
      status:
        "disabled",
      notificationId:
        null,
      push:
        null,
    };
  }

  const title =
    clampText(
      input.title,
      120,
    );

  const body =
    clampText(
      input.body,
      240,
    );

  const dedupeKey =
    normalizeDedupeKey(
      input.dedupeKey,
    );

  if (
    !input.userId ||
    !title ||
    !body ||
    (
      input.dedupeKey &&
      !dedupeKey
    )
  ) {
    return {
      ok: false,
      status:
        "invalid",
      notificationId:
        null,
      push:
        null,
    };
  }

  const targetUrl =
    safeInternalTarget(
      input.targetUrl,
    );

  try {
    const inserted =
      await db
        .insert(
          notifications,
        )
        .values({
          userId:
            input.userId,
          type:
            input.type,
          title,
          body,
          targetUrl,
          dedupeKey,
        })
        .onConflictDoNothing()
        .returning({
          id:
            notifications.id,
        });

    const notificationId =
      inserted[0]?.id;

    if (
      !notificationId
    ) {
      return {
        ok: true,
        status:
          "deduped",
        notificationId:
          null,
        push:
          null,
      };
    }

    const push =
      await deliverPushToUserBestEffort(
        input.userId,
        {
          title,
          body,
          targetUrl,
          tag:
            dedupeKey,
        },
      );

    return {
      ok: true,
      status:
        "created",
      notificationId,
      push,
    };
  } catch (error) {
    logEventFailure(
      "create_user_event",
      error,
    );

    return {
      ok: false,
      status:
        "unavailable",
      notificationId:
        null,
      push:
        null,
    };
  }
}

export async function createStaffNotificationEventBestEffort(
  input: Omit<
    NotificationEventInput,
    "userId"
  >,
): Promise<StaffNotificationResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      enabled: false,
      available: true,
      recipients: 0,
      created: 0,
      deduped: 0,
      failed: 0,
    };
  }

  let staff:
    Array<{
      id: string;
    }>;

  try {
    staff =
      await db
        .select({
          id:
            users.id,
        })
        .from(
          users,
        )
        .where(
          or(
            eq(
              users.role,
              "ADMIN",
            ),
            eq(
              users.role,
              "OPERATOR",
            ),
          ),
        )
        .limit(
          100,
        );
  } catch (error) {
    logEventFailure(
      "load_staff_recipients",
      error,
    );

    return {
      enabled: true,
      available: false,
      recipients: 0,
      created: 0,
      deduped: 0,
      failed: 0,
    };
  }

  let created = 0;
  let deduped = 0;
  let failed = 0;

  for (
    const recipient
    of staff
  ) {
    const result =
      await createUserNotificationEventBestEffort({
        ...input,
        userId:
          recipient.id,
      });

    if (
      result.status ===
      "created"
    ) {
      created += 1;
      continue;
    }

    if (
      result.status ===
      "deduped"
    ) {
      deduped += 1;
      continue;
    }

    if (
      result.status ===
      "disabled"
    ) {
      continue;
    }

    failed += 1;
  }

  return {
    enabled: true,
    available:
      failed === 0,
    recipients:
      staff.length,
    created,
    deduped,
    failed,
  };
}
