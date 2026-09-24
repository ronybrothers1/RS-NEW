export type NotificationConfigReason =
  | "disabled"
  | "ready"
  | "missing_vapid"
  | "invalid_subject";

export type NotificationRuntimeState = {
  enabled: boolean;
  ready: boolean;
  publicKey: string | null;
  subject: string | null;
  reason: NotificationConfigReason;
};

export type VapidServerConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

function envValue(
  key: string,
) {
  return (
    process.env[key]?.trim() ||
    ""
  );
}

function hasValidVapidSubject(
  value: string,
) {
  return (
    value.startsWith(
      "mailto:",
    ) ||
    value.startsWith(
      "https://",
    )
  );
}

export function notificationsEnabled() {
  return (
    envValue(
      "NOTIFICATIONS_ENABLED",
    ).toLowerCase() ===
    "true"
  );
}

export function getNotificationRuntimeState():
  NotificationRuntimeState {
  const enabled =
    notificationsEnabled();

  const publicKey =
    envValue(
      "VAPID_PUBLIC_KEY",
    );

  const privateKey =
    envValue(
      "VAPID_PRIVATE_KEY",
    );

  const subject =
    envValue(
      "VAPID_SUBJECT",
    );

  if (!enabled) {
    return {
      enabled: false,
      ready: false,
      publicKey:
        publicKey || null,
      subject:
        subject || null,
      reason: "disabled",
    };
  }

  if (
    !publicKey ||
    !privateKey ||
    !subject
  ) {
    return {
      enabled: true,
      ready: false,
      publicKey:
        publicKey || null,
      subject:
        subject || null,
      reason:
        "missing_vapid",
    };
  }

  if (
    !hasValidVapidSubject(
      subject,
    )
  ) {
    return {
      enabled: true,
      ready: false,
      publicKey,
      subject,
      reason:
        "invalid_subject",
    };
  }

  return {
    enabled: true,
    ready: true,
    publicKey,
    subject,
    reason: "ready",
  };
}

export function getVapidServerConfig():
  VapidServerConfig | null {
  const state =
    getNotificationRuntimeState();

  if (!state.ready) {
    return null;
  }

  const publicKey =
    envValue(
      "VAPID_PUBLIC_KEY",
    );

  const privateKey =
    envValue(
      "VAPID_PRIVATE_KEY",
    );

  const subject =
    envValue(
      "VAPID_SUBJECT",
    );

  if (
    !publicKey ||
    !privateKey ||
    !subject
  ) {
    return null;
  }

  return {
    publicKey,
    privateKey,
    subject,
  };
}
