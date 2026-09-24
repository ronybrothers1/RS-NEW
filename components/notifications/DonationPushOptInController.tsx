"use client";

import {
  Bell,
  BellOff,
  CircleAlert,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  useState,
} from "react";

type ControllerState =
  | "idle"
  | "working"
  | "active"
  | "denied"
  | "unsupported"
  | "error";

type NotificationConfig = {
  enabled: boolean;
  ready: boolean;
  publicKey: string | null;
};

function supportsPush() {
  return (
    typeof window !==
      "undefined" &&
    "serviceWorker" in
      navigator &&
    "PushManager" in
      window &&
    "Notification" in
      window
  );
}

async function loadNotificationConfig():
  Promise<NotificationConfig | null> {
  try {
    const response =
      await fetch(
        "/api/notifikasi/config",
        {
          method: "GET",
          cache: "no-store",
          credentials:
            "same-origin",
          headers: {
            Accept:
              "application/json",
          },
        },
      );

    if (!response.ok) {
      return null;
    }

    const value: unknown =
      await response.json();

    if (
      typeof value !==
        "object" ||
      value === null
    ) {
      return null;
    }

    const candidate =
      value as {
        enabled?: unknown;
        ready?: unknown;
        publicKey?: unknown;
      };

    if (
      typeof candidate.enabled !==
        "boolean" ||
      typeof candidate.ready !==
        "boolean"
    ) {
      return null;
    }

    return {
      enabled:
        candidate.enabled,
      ready:
        candidate.ready,
      publicKey:
        typeof candidate.publicKey ===
        "string"
          ? candidate.publicKey
          : null,
    };
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(
  value: string,
) {
  const padding =
    "=".repeat(
      (
        4 -
        (
          value.length %
          4
        )
      ) %
        4,
    );

  const base64 =
    (
      value +
      padding
    )
      .replace(
        /-/g,
        "+",
      )
      .replace(
        /_/g,
        "/",
      );

  const raw =
    window.atob(
      base64,
    );

  const bytes =
    new Uint8Array(
      raw.length,
    );

  for (
    let index = 0;
    index < raw.length;
    index += 1
  ) {
    bytes[index] =
      raw.charCodeAt(
        index,
      );
  }

  return bytes;
}

function subscriptionPayload(
  subscription:
    PushSubscription,
) {
  const json =
    subscription.toJSON();

  const p256dh =
    json.keys?.p256dh;

  const auth =
    json.keys?.auth;

  if (
    !subscription.endpoint ||
    !p256dh ||
    !auth
  ) {
    return null;
  }

  return {
    endpoint:
      subscription.endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
}

export default function DonationPushOptInController({
  reference,
  capabilityToken,
}: {
  reference: string;
  capabilityToken: string;
}) {
  const [
    state,
    setState,
  ] =
    useState<ControllerState>(
      "idle",
    );

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  async function handleEnable() {
    setMessage(
      null,
    );

    if (!supportsPush()) {
      setState(
        "unsupported",
      );

      return;
    }

    setState(
      "working",
    );

    try {
      const config =
        await loadNotificationConfig();

      if (
        !config ||
        !config.enabled ||
        !config.ready ||
        !config.publicKey
      ) {
        setState(
          "error",
        );

        setMessage(
          "Notifikasi status belum tersedia. Donasi tetap tercatat dan dapat dicek menggunakan nomor registrasi.",
        );

        return;
      }

      if (
        Notification.permission ===
        "denied"
      ) {
        setState(
          "denied",
        );

        return;
      }

      const registration =
        await navigator
          .serviceWorker
          .register(
            "/push-sw.js",
            {
              scope: "/",
              updateViaCache:
                "none",
            },
          );

      const permission:
        NotificationPermission =
          Notification.permission ===
          "default"
            ? await Notification
                .requestPermission()
            : Notification.permission;

      if (
        permission !==
        "granted"
      ) {
        setState(
          permission ===
            "denied"
            ? "denied"
            : "idle",
        );

        return;
      }

      let subscription =
        await registration
          .pushManager
          .getSubscription();

      if (!subscription) {
        subscription =
          await registration
            .pushManager
            .subscribe({
              userVisibleOnly:
                true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  config.publicKey,
                ),
            });
      }

      const payload =
        subscriptionPayload(
          subscription,
        );

      if (!payload) {
        throw new Error(
          "invalid_push_subscription",
        );
      }

      const response =
        await fetch(
          "/api/notifikasi/donasi/subscription",
          {
            method:
              "POST",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify({
                reference,
                capabilityToken,
                endpoint:
                  payload.endpoint,
                keys:
                  payload.keys,
              }),
          },
        );

      if (!response.ok) {
        let reason =
          "unknown";

        try {
          const result: unknown =
            await response.json();

          if (
            typeof result ===
              "object" &&
            result !== null &&
            typeof (
              result as {
                reason?: unknown;
              }
            ).reason ===
              "string"
          ) {
            reason =
              (
                result as {
                  reason: string;
                }
              ).reason;
          }
        } catch {
          reason =
            "unknown";
        }

        if (
          reason ===
          "donation_finalized"
        ) {
          setState(
            "error",
          );

          setMessage(
            "Status donasi sudah selesai diproses. Silakan gunakan nomor registrasi untuk melihat hasil verifikasi.",
          );

          return;
        }

        throw new Error(
          "subscription_save_failed",
        );
      }

      setState(
        "active",
      );

      setMessage(
        "Notifikasi status donasi telah aktif pada perangkat ini.",
      );
    } catch {
      setState(
        "error",
      );

      setMessage(
        "Notifikasi belum dapat diaktifkan. Donasi tetap aman dan status tetap dapat dicek menggunakan nomor registrasi.",
      );
    }
  }

  async function handleDisable() {
    setMessage(
      null,
    );

    if (!supportsPush()) {
      setState(
        "unsupported",
      );

      return;
    }

    setState(
      "working",
    );

    try {
      const registration =
        await navigator
          .serviceWorker
          .getRegistration(
            "/",
          );

      const subscription =
        await registration
          ?.pushManager
          .getSubscription();

      if (!subscription) {
        setState(
          "idle",
        );

        return;
      }

      const response =
        await fetch(
          "/api/notifikasi/donasi/subscription",
          {
            method:
              "DELETE",
            credentials:
              "same-origin",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify({
                reference,
                capabilityToken,
                endpoint:
                  subscription.endpoint,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          "subscription_detach_failed",
        );
      }

      /*
       * Jangan unsubscribe browser secara global.
       * Endpoint yang sama dapat dipakai oleh
       * akun atau donasi lain.
       */
      setState(
        "idle",
      );

      setMessage(
        "Notifikasi untuk donasi ini telah dinonaktifkan.",
      );
    } catch {
      setState(
        "error",
      );

      setMessage(
        "Pengaturan notifikasi belum dapat diperbarui. Status donasi tetap dapat dicek secara manual.",
      );
    }
  }

  if (
    state ===
    "unsupported"
  ) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

          <div>
            <h3 className="font-semibold text-slate-950">
              Notifikasi tidak tersedia
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Browser atau perangkat ini belum mendukung notifikasi status.
              Anda tetap dapat mengecek status menggunakan nomor registrasi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (
    state ===
    "denied"
  ) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

          <div>
            <h3 className="font-semibold text-slate-950">
              Izin notifikasi diblokir
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              Donasi tetap tercatat. Jika ingin menerima notifikasi,
              aktifkan izin melalui pengaturan browser atau aplikasi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
            {state ===
            "active" ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">
              Notifikasi Status Donasi
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {state ===
              "active"
                ? "Perangkat ini akan menerima pembaruan ketika status donasi berubah."
                : "Aktifkan jika Anda ingin menerima pembaruan status donasi pada perangkat ini."}
            </p>

            {message && (
              <p
                aria-live="polite"
                className="mt-2 text-sm leading-6 text-slate-600"
              >
                {message}
              </p>
            )}
          </div>
        </div>

        {state ===
        "active" ? (
          <button
            type="button"
            onClick={
              handleDisable
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            Nonaktifkan
          </button>
        ) : (
          <button
            type="button"
            onClick={
              handleEnable
            }
            disabled={
              state ===
              "working"
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {state ===
            "working" && (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            )}

            Aktifkan Notifikasi
          </button>
        )}
      </div>
    </section>
  );
}
