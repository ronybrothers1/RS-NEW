"use client";

import {
  Bell,
  BellOff,
  CircleAlert,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type NotificationConfig = {
  enabled: boolean;
  ready: boolean;
  publicKey: string | null;
};

type ControllerState =
  | "checking"
  | "disabled"
  | "unsupported"
  | "idle"
  | "working"
  | "active"
  | "denied"
  | "error";

function browserSupportsPush() {
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

async function findPushRegistration() {
  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    return null;
  }

  const expectedScript =
    new URL(
      "/push-sw.js",
      window.location.origin,
    ).href;

  const registrations =
    await navigator
      .serviceWorker
      .getRegistrations();

  for (
    const registration
    of registrations
  ) {
    const workers = [
      registration.active,
      registration.waiting,
      registration.installing,
    ];

    const matches =
      workers.some(
        (worker) =>
          worker?.scriptURL ===
          expectedScript,
      );

    if (matches) {
      return registration;
    }
  }

  return null;
}

async function waitForPushRegistration() {
  const readyPromise =
    navigator.serviceWorker.ready;

  const timeoutPromise =
    new Promise<never>(
      (_, reject) => {
        window.setTimeout(
          () => {
            reject(
              new Error(
                "service_worker_timeout",
              ),
            );
          },
          15000,
        );
      },
    );

  await Promise.race([
    readyPromise,
    timeoutPromise,
  ]);

  const registration =
    await findPushRegistration();

  if (!registration) {
    throw new Error(
      "push_registration_missing",
    );
  }

  return registration;
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

async function saveSubscription(
  subscription:
    PushSubscription,
) {
  const payload =
    subscriptionPayload(
      subscription,
    );

  if (!payload) {
    return false;
  }

  try {
    const response =
      await fetch(
        "/api/notifikasi/subscription",
        {
          method: "POST",
          credentials:
            "same-origin",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body:
            JSON.stringify(
              payload,
            ),
        },
      );

    if (!response.ok) {
      return false;
    }

    const result: unknown =
      await response.json();

    return (
      typeof result ===
        "object" &&
      result !== null &&
      (
        result as {
          ok?: unknown;
        }
      ).ok === true
    );
  } catch {
    return false;
  }
}

async function deactivateSubscription(
  endpoint: string,
) {
  try {
    await fetch(
      "/api/notifikasi/subscription",
      {
        method: "DELETE",
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
            endpoint,
          }),
      },
    );
  } catch {
    // Browser unsubscribe remains authoritative
    // for this device even if server cleanup
    // temporarily fails.
  }
}

export default function PushOptInController() {
  const [
    state,
    setState,
  ] =
    useState<ControllerState>(
      "checking",
    );

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  const refreshState =
    useCallback(
      async () => {
        if (
          !browserSupportsPush()
        ) {
          setState(
            "unsupported",
          );

          return;
        }

        const config =
          await loadNotificationConfig();

        if (!config) {
          setState(
            "error",
          );

          return;
        }

        if (
          !config.enabled ||
          !config.ready ||
          !config.publicKey
        ) {
          setState(
            "disabled",
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

        try {
          const registration =
            await findPushRegistration();

          if (!registration) {
            setState(
              "idle",
            );

            return;
          }

          const subscription =
            await registration
              .pushManager
              .getSubscription();

          setState(
            subscription
              ? "active"
              : "idle",
          );
        } catch {
          setState(
            "error",
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      let cancelled =
        false;

      void (
        async () => {
          if (cancelled) {
            return;
          }

          await refreshState();
        }
      )();

      return () => {
        cancelled = true;
      };
    },
    [
      refreshState,
    ],
  );

  async function handleEnable() {
    setMessage(
      null,
    );

    if (
      !browserSupportsPush()
    ) {
      setState(
        "unsupported",
      );

      return;
    }

    setState(
      "working",
    );

    const config =
      await loadNotificationConfig();

    if (
      !config ||
      !config.enabled ||
      !config.ready ||
      !config.publicKey
    ) {
      setState(
        "disabled",
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

    let createdSubscription:
      PushSubscription | null =
        null;

    try {
      let registration =
        await findPushRegistration();

      if (!registration) {
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

        registration =
          await waitForPushRegistration();
      }

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

        createdSubscription =
          subscription;
      }

      const saved =
        await saveSubscription(
          subscription,
        );

      if (!saved) {
        if (
          createdSubscription
        ) {
          await createdSubscription
            .unsubscribe();
        }

        setState(
          "error",
        );

        setMessage(
          "Notifikasi belum dapat diaktifkan. Tidak ada fungsi lain yang terpengaruh.",
        );

        return;
      }

      setState(
        "active",
      );

      setMessage(
        "Notifikasi status telah aktif pada perangkat ini.",
      );
    } catch {
      if (
        createdSubscription
      ) {
        try {
          await createdSubscription
            .unsubscribe();
        } catch {
          // Best effort cleanup.
        }
      }

      setState(
        "error",
      );

      setMessage(
        "Notifikasi belum dapat diaktifkan. Silakan coba lagi nanti.",
      );
    }
  }

  async function handleDisable() {
    setMessage(
      null,
    );

    setState(
      "working",
    );

    try {
      const registration =
        await findPushRegistration();

      if (!registration) {
        setState(
          "idle",
        );

        return;
      }

      const subscription =
        await registration
          .pushManager
          .getSubscription();

      if (!subscription) {
        setState(
          "idle",
        );

        return;
      }

      const endpoint =
        subscription.endpoint;

      const removed =
        await subscription
          .unsubscribe();

      if (!removed) {
        setState(
          "error",
        );

        setMessage(
          "Notifikasi belum dapat dinonaktifkan pada perangkat ini.",
        );

        return;
      }

      await deactivateSubscription(
        endpoint,
      );

      setState(
        "idle",
      );

      setMessage(
        "Notifikasi telah dinonaktifkan pada perangkat ini.",
      );
    } catch {
      setState(
        "error",
      );

      setMessage(
        "Pengaturan notifikasi sementara tidak dapat diperbarui.",
      );
    }
  }

  if (
    state ===
    "disabled"
  ) {
    return null;
  }

  if (
    state ===
    "checking"
  ) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Memeriksa dukungan notifikasi...
        </div>
      </section>
    );
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
            <h2 className="font-semibold text-slate-950">
              Notifikasi tidak tersedia
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Browser atau perangkat ini belum mendukung Web Push.
              Fitur lainnya tetap dapat digunakan seperti biasa.
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
            <h2 className="font-semibold text-slate-950">
              Izin notifikasi diblokir
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              Anda tetap dapat menggunakan semua layanan. Jika ingin
              menerima notifikasi, aktifkan izin notifikasi melalui
              pengaturan browser atau aplikasi pada perangkat.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            {state ===
            "active" ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Notifikasi Status
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {state ===
              "active"
                ? "Notifikasi aktif pada perangkat ini."
                : "Aktifkan untuk menerima pembaruan status penting pada perangkat ini."}
            </p>

            {message && (
              <p
                aria-live="polite"
                className="mt-2 text-sm text-slate-600"
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
            disabled={
              state ===
              "working"
            }
            onClick={
              handleEnable
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
