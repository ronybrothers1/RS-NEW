import {
  and,
  eq,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";

import {
  pushSubscriptions,
} from "@/src/db/schema";

import {
  hashNotificationValue,
} from "./capability.server";

import {
  notificationsEnabled,
} from "./config.server";

export type BrowserPushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushSubscriptionMutationResult = {
  ok: boolean;
  reason:
    | "ok"
    | "disabled"
    | "unavailable";
};

function logSubscriptionFailure(
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

export async function upsertUserPushSubscription(
  userId: string,
  subscription: BrowserPushSubscriptionInput,
): Promise<PushSubscriptionMutationResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      ok: false,
      reason: "disabled",
    };
  }

  const now =
    new Date();

  const endpointHash =
    hashNotificationValue(
      subscription.endpoint,
    );

  try {
    await db
      .insert(
        pushSubscriptions,
      )
      .values({
        userId,
        endpointHash,
        endpoint:
          subscription.endpoint,
        p256dh:
          subscription.p256dh,
        auth:
          subscription.auth,
        isActive: true,
        failureCount: 0,
        lastFailureAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target:
          pushSubscriptions.endpointHash,
        set: {
          userId,
          endpoint:
            subscription.endpoint,
          p256dh:
            subscription.p256dh,
          auth:
            subscription.auth,
          isActive: true,
          failureCount: 0,
          lastFailureAt: null,
          updatedAt: now,
        },
      });

    return {
      ok: true,
      reason: "ok",
    };
  } catch (error) {
    logSubscriptionFailure(
      "subscription_upsert",
      error,
    );

    return {
      ok: false,
      reason:
        "unavailable",
    };
  }
}

export async function deactivateUserPushSubscription(
  userId: string,
  endpoint: string,
): Promise<PushSubscriptionMutationResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      ok: false,
      reason: "disabled",
    };
  }

  const endpointHash =
    hashNotificationValue(
      endpoint,
    );

  try {
    await db
      .update(
        pushSubscriptions,
      )
      .set({
        isActive: false,
        updatedAt:
          new Date(),
      })
      .where(
        and(
          eq(
            pushSubscriptions.userId,
            userId,
          ),
          eq(
            pushSubscriptions.endpointHash,
            endpointHash,
          ),
        ),
      );

    return {
      ok: true,
      reason: "ok",
    };
  } catch (error) {
    logSubscriptionFailure(
      "subscription_deactivate",
      error,
    );

    return {
      ok: false,
      reason:
        "unavailable",
    };
  }
}
