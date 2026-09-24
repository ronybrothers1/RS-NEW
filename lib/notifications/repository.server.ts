import {
  and,
  desc,
  eq,
  isNull,
  sql,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";

import {
  notifications,
} from "@/src/db/schema";

import {
  notificationsEnabled,
} from "./config.server";

export type NotificationCenterItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  targetUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationCenterResult = {
  enabled: boolean;
  available: boolean;
  items: NotificationCenterItem[];
  unreadCount: number;
};

export type NotificationMutationResult = {
  ok: boolean;
  reason:
    | "ok"
    | "disabled"
    | "unavailable";
};

function safeLimit(
  value: number,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 30;
  }

  return Math.min(
    100,
    Math.max(
      1,
      Math.trunc(
        value,
      ),
    ),
  );
}

function logRepositoryFailure(
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

export async function getNotificationCenter(
  userId: string,
  limit = 30,
): Promise<NotificationCenterResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      enabled: false,
      available: true,
      items: [],
      unreadCount: 0,
    };
  }

  try {
    const effectiveLimit =
      safeLimit(
        limit,
      );

    const [
      items,
      unreadRows,
    ] =
      await Promise.all([
        db
          .select({
            id:
              notifications.id,
            type:
              notifications.type,
            title:
              notifications.title,
            body:
              notifications.body,
            targetUrl:
              notifications.targetUrl,
            readAt:
              notifications.readAt,
            createdAt:
              notifications.createdAt,
          })
          .from(
            notifications,
          )
          .where(
            eq(
              notifications.userId,
              userId,
            ),
          )
          .orderBy(
            desc(
              notifications.createdAt,
            ),
            desc(
              notifications.id,
            ),
          )
          .limit(
            effectiveLimit,
          ),

        db
          .select({
            count:
              sql<number>`
                count(*)::int
              `,
          })
          .from(
            notifications,
          )
          .where(
            and(
              eq(
                notifications.userId,
                userId,
              ),
              isNull(
                notifications.readAt,
              ),
            ),
          ),
      ]);

    return {
      enabled: true,
      available: true,
      items,
      unreadCount:
        unreadRows[0]?.count ??
        0,
    };
  } catch (error) {
    logRepositoryFailure(
      "get_center",
      error,
    );

    return {
      enabled: true,
      available: false,
      items: [],
      unreadCount: 0,
    };
  }
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<NotificationMutationResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      ok: false,
      reason: "disabled",
    };
  }

  try {
    await db
      .update(
        notifications,
      )
      .set({
        readAt:
          new Date(),
      })
      .where(
        and(
          eq(
            notifications.id,
            notificationId,
          ),
          eq(
            notifications.userId,
            userId,
          ),
          isNull(
            notifications.readAt,
          ),
        ),
      );

    return {
      ok: true,
      reason: "ok",
    };
  } catch (error) {
    logRepositoryFailure(
      "mark_read",
      error,
    );

    return {
      ok: false,
      reason:
        "unavailable",
    };
  }
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<NotificationMutationResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      ok: false,
      reason: "disabled",
    };
  }

  try {
    await db
      .update(
        notifications,
      )
      .set({
        readAt:
          new Date(),
      })
      .where(
        and(
          eq(
            notifications.userId,
            userId,
          ),
          isNull(
            notifications.readAt,
          ),
        ),
      );

    return {
      ok: true,
      reason: "ok",
    };
  } catch (error) {
    logRepositoryFailure(
      "mark_all_read",
      error,
    );

    return {
      ok: false,
      reason:
        "unavailable",
    };
  }
}
