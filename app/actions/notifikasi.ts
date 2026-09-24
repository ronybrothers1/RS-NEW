"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  z,
} from "zod";

import {
  getCurrentDbUser,
} from "@/lib/current-authz";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/repository.server";

const notificationIdSchema =
  z.string().uuid();

function revalidateNotificationCenters() {
  revalidatePath(
    "/akun/notifikasi",
  );

  revalidatePath(
    "/admin/notifikasi",
  );
}

export async function markNotificationReadAction(
  formData: FormData,
) {
  const user =
    await getCurrentDbUser();

  if (!user) {
    return;
  }

  const parsed =
    notificationIdSchema.safeParse(
      formData.get(
        "notificationId",
      ),
    );

  if (!parsed.success) {
    return;
  }

  const result =
    await markNotificationRead(
      user.id,
      parsed.data,
    );

  if (result.ok) {
    revalidateNotificationCenters();
  }
}

export async function markAllNotificationsReadAction() {
  const user =
    await getCurrentDbUser();

  if (!user) {
    return;
  }

  const result =
    await markAllNotificationsRead(
      user.id,
    );

  if (result.ok) {
    revalidateNotificationCenters();
  }
}
