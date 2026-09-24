"use strict";

function safeText(
  value,
  fallback,
  maxLength,
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  const clean =
    value.trim();

  if (!clean) {
    return fallback;
  }

  if (
    clean.length <=
    maxLength
  ) {
    return clean;
  }

  return (
    clean.slice(
      0,
      Math.max(
        0,
        maxLength - 1,
      ),
    ) + "…"
  );
}

function safePath(
  value,
) {
  if (
    typeof value !==
    "string" ||
    !value.startsWith(
      "/",
    ) ||
    value.startsWith(
      "//",
    )
  ) {
    return "/";
  }

  try {
    const url =
      new URL(
        value,
        self.location.origin,
      );

    if (
      url.origin !==
      self.location.origin
    ) {
      return "/";
    }

    return (
      url.pathname +
      url.search +
      url.hash
    );
  } catch {
    return "/";
  }
}

self.addEventListener(
  "push",
  (event) => {
    let data = {};

    try {
      data =
        event.data
          ? event.data.json()
          : {};
    } catch {
      data = {};
    }

    const title =
      safeText(
        data.title,
        "Ruang Sejahtera",
        120,
      );

    const body =
      safeText(
        data.body,
        "Ada pembaruan pada layanan Ruang Sejahtera.",
        240,
      );

    const url =
      safePath(
        data.url,
      );

    const tag =
      safeText(
        data.tag,
        "",
        80,
      );

    const options = {
      body,
      icon:
        "/pwa/app-icon-192.png",
      data: {
        url,
      },
      renotify: false,
    };

    if (tag) {
      options.tag =
        tag;
    }

    event.waitUntil(
      self.registration.showNotification(
        title,
        options,
      ),
    );
  },
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetPath =
      safePath(
        event.notification
          ?.data?.url,
      );

    const targetUrl =
      new URL(
        targetPath,
        self.location.origin,
      ).href;

    event.waitUntil(
      (async () => {
        const windows =
          await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
          });

        for (
          const client of windows
        ) {
          try {
            const clientUrl =
              new URL(
                client.url,
              );

            if (
              clientUrl.origin !==
              self.location.origin
            ) {
              continue;
            }

            if (
              "navigate" in client &&
              client.url !==
                targetUrl
            ) {
              await client.navigate(
                targetUrl,
              );
            }

            if (
              "focus" in client
            ) {
              return client.focus();
            }
          } catch {
            continue;
          }
        }

        return self.clients.openWindow(
          targetUrl,
        );
      })(),
    );
  },
);
