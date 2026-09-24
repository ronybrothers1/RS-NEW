import {
  Bell,
  BellOff,
  Check,
  CircleAlert,
} from "lucide-react";

import Link from "next/link";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifikasi";

import type {
  NotificationCenterResult,
} from "@/lib/notifications/repository.server";

function safeInternalTarget(
  targetUrl: string | null,
) {
  if (
    !targetUrl ||
    !targetUrl.startsWith(
      "/",
    ) ||
    targetUrl.startsWith(
      "//",
    )
  ) {
    return null;
  }

  return targetUrl;
}

function formatDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
      timeZone:
        "Asia/Jakarta",
    },
  ).format(
    value,
  );
}

export default function NotificationCenterView({
  result,
}: {
  result:
    NotificationCenterResult;
}) {
  if (!result.enabled) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <BellOff className="h-5 w-5" />
        </div>

        <h2 className="mt-5 text-lg font-bold text-slate-950">
          Notifikasi belum diaktifkan
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pusat notifikasi sedang
          dipersiapkan. Fungsi website dan
          aplikasi lainnya tetap berjalan
          seperti biasa.
        </p>
      </section>
    );
  }

  if (!result.available) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-700">
          <CircleAlert className="h-5 w-5" />
        </div>

        <h2 className="mt-5 text-lg font-bold text-slate-950">
          Pusat notifikasi sementara
          tidak tersedia
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          Gangguan pada notifikasi tidak
          memengaruhi fitur lain. Silakan
          tetap gunakan status donasi,
          pengajuan, dan layanan lainnya
          seperti biasa.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-700" />

            <h2 className="font-bold text-slate-950">
              Notifikasi
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {result.unreadCount > 0
              ? `${result.unreadCount} belum dibaca`
              : "Tidak ada notifikasi baru"}
          </p>
        </div>

        {result.unreadCount > 0 && (
          <form
            action={
              markAllNotificationsReadAction
            }
          >
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <Check className="h-4 w-4" />
              Tandai semua dibaca
            </button>
          </form>
        )}
      </div>

      {result.items.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-300" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Belum ada notifikasi.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {result.items.map(
            (item) => {
              const target =
                safeInternalTarget(
                  item.targetUrl,
                );

              return (
                <article
                  key={item.id}
                  className={
                    item.readAt
                      ? "p-5"
                      : "bg-teal-50/40 p-5"
                  }
                >
                  <div className="flex gap-4">
                    <div
                      className={
                        item.readAt
                          ? "mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-200"
                          : "mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-600"
                      }
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.body}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(
                          item.createdAt,
                        )}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {target && (
                          <Link
                            href={target}
                            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                          >
                            Lihat detail
                          </Link>
                        )}

                        {!item.readAt && (
                          <form
                            action={
                              markNotificationReadAction
                            }
                          >
                            <input
                              type="hidden"
                              name="notificationId"
                              value={item.id}
                            />

                            <button
                              type="submit"
                              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                            >
                              Tandai dibaca
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}
