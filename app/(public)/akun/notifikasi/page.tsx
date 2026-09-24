import {
  Bell,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import NotificationCenterView from "@/components/notifications/NotificationCenterView";
import PushOptInController from "@/components/notifications/PushOptInController";

import {
  getCurrentDbUser,
} from "@/lib/current-authz";

import {
  getNotificationCenter,
} from "@/lib/notifications/repository.server";

export const dynamic =
  "force-dynamic";

export default async function AccountNotificationsPage() {
  const user =
    await getCurrentDbUser();

  if (!user) {
    redirect(
      "/login",
    );
  }

  if (
    user.role !== "USER"
  ) {
    redirect(
      "/admin/notifikasi",
    );
  }

  if (
    !user.emailVerifiedAt
  ) {
    redirect(
      "/verifikasi-email",
    );
  }

  const center =
    await getNotificationCenter(
      user.id,
      50,
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Bell className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Akun Pengguna
              </p>

              <h1 className="text-2xl font-bold text-slate-950">
                Pusat Notifikasi
              </h1>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {center.enabled && (
          <div className="mb-6">
            <PushOptInController />
          </div>
        )}

        <NotificationCenterView
          result={center}
        />
      </div>
    </main>
  );
}
