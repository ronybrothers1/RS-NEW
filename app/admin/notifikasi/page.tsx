import {
  Bell,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import NotificationCenterView from "@/components/notifications/NotificationCenterView";
import PushOptInController from "@/components/notifications/PushOptInController";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";

import {
  getNotificationCenter,
} from "@/lib/notifications/repository.server";

export const dynamic =
  "force-dynamic";

export default async function AdminNotificationsPage() {
  const user =
    await getCurrentStaffUser();

  if (!user) {
    redirect(
      "/login",
    );
  }

  const center =
    await getNotificationCenter(
      user.id,
      50,
    );

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
          <Bell className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">
            Sistem
          </p>

          <h1 className="text-2xl font-bold text-slate-950">
            Pusat Notifikasi
          </h1>
        </div>
      </div>

      {center.enabled && (
        <div className="mb-6">
          <PushOptInController />
        </div>
      )}

      <NotificationCenterView
        result={center}
      />
    </section>
  );
}
