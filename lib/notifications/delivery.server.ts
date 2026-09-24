import {
  and,
  desc,
  eq,
  sql,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";

import {
  pushSubscriptions,
} from "@/src/db/schema";

import {
  notificationsEnabled,
} from "./config.server";

import {
  sendPushBestEffort,
} from "./push.server";

import type {
  SafePushMessage,
} from "./push.server";

export type UserPushDeliveryResult = {
  enabled: boolean;
  available: boolean;
  subscriptions: number;
  attempted: number;
  delivered: number;
  failed: number;
  deactivated: number;
};

function logDeliveryFailure(
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

export async function deliverPushToUserBestEffort(
  userId: string,
  message: SafePushMessage,
): Promise<UserPushDeliveryResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      enabled: false,
      available: true,
      subscriptions: 0,
      attempted: 0,
      delivered: 0,
      failed: 0,
      deactivated: 0,
    };
  }

  let subscriptions:
    Array<{
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
    }>;

  try {
    subscriptions =
      await db
        .select({
          id:
            pushSubscriptions.id,
          endpoint:
            pushSubscriptions.endpoint,
          p256dh:
            pushSubscriptions.p256dh,
          auth:
            pushSubscriptions.auth,
        })
        .from(
          pushSubscriptions,
        )
        .where(
          and(
            eq(
              pushSubscriptions.userId,
              userId,
            ),
            eq(
              pushSubscriptions.isActive,
              true,
            ),
          ),
        )
        .orderBy(
          desc(
            pushSubscriptions.updatedAt,
          ),
        )
        .limit(
          10,
        );
  } catch (error) {
    logDeliveryFailure(
      "load_user_subscriptions",
      error,
    );

    return {
      enabled: true,
      available: false,
      subscriptions: 0,
      attempted: 0,
      delivered: 0,
      failed: 0,
      deactivated: 0,
    };
  }

  let attempted = 0;
  let delivered = 0;
  let failed = 0;
  let deactivated = 0;

  for (
    const subscription
    of subscriptions
  ) {
    try {
      const result =
        await sendPushBestEffort(
          {
            endpoint:
              subscription.endpoint,
            p256dh:
              subscription.p256dh,
            auth:
              subscription.auth,
          },
          message,
        );

      if (
        result.attempted
      ) {
        attempted += 1;
      }

      if (
        result.status ===
        "sent"
      ) {
        delivered += 1;

        try {
          await db
            .update(
              pushSubscriptions,
            )
            .set({
              failureCount: 0,
              lastSuccessAt:
                new Date(),
              updatedAt:
                new Date(),
            })
            .where(
              eq(
                pushSubscriptions.id,
                subscription.id,
              ),
            );
        } catch (error) {
          logDeliveryFailure(
            "mark_push_success",
            error,
          );
        }

        continue;
      }

      if (
        result.status ===
        "gone"
      ) {
        failed += 1;
        deactivated += 1;

        try {
          await db
            .update(
              pushSubscriptions,
            )
            .set({
              isActive: false,
              failureCount:
                sql`${pushSubscriptions.failureCount} + 1`,
              lastFailureAt:
                new Date(),
              updatedAt:
                new Date(),
            })
            .where(
              eq(
                pushSubscriptions.id,
                subscription.id,
              ),
            );
        } catch (error) {
          logDeliveryFailure(
            "deactivate_gone_subscription",
            error,
          );
        }

        continue;
      }

      if (
        result.status ===
        "failed"
      ) {
        failed += 1;

        try {
          await db
            .update(
              pushSubscriptions,
            )
            .set({
              failureCount:
                sql`${pushSubscriptions.failureCount} + 1`,
              lastFailureAt:
                new Date(),
              updatedAt:
                new Date(),
            })
            .where(
              eq(
                pushSubscriptions.id,
                subscription.id,
              ),
            );
        } catch (error) {
          logDeliveryFailure(
            "mark_push_failure",
            error,
          );
        }
      }
    } catch (error) {
      failed += 1;

      logDeliveryFailure(
        "deliver_subscription",
        error,
      );
    }
  }

  return {
    enabled: true,
    available: true,
    subscriptions:
      subscriptions.length,
    attempted,
    delivered,
    failed,
    deactivated,
  };
}
