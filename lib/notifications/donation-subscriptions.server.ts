import {
  and,
  eq,
} from "drizzle-orm";

import {
  db,
} from "@/src/db";

import {
  donations,
  donationPushSubscriptions,
  pushSubscriptions,
} from "@/src/db/schema";

import {
  hashNotificationValue,
  verifyDonationNotificationCapability,
} from "./capability.server";

import {
  notificationsEnabled,
} from "./config.server";

export type DonationPushSubscriptionInput = {
  reference: string;
  capabilityToken: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type DonationPushDetachInput = {
  reference: string;
  capabilityToken: string;
  endpoint: string;
};

export type DonationPushMutationStatus =
  | "ok"
  | "disabled"
  | "invalid_reference"
  | "not_found"
  | "unauthorized"
  | "expired"
  | "finalized"
  | "unavailable";

export type DonationPushMutationResult = {
  ok: boolean;
  status: DonationPushMutationStatus;
};

const CAPABILITY_MAX_AGE_MS =
  7 * 24 * 60 * 60 * 1000;

function parseDonationReference(
  value: string,
) {
  const normalized =
    value
      .trim()
      .toUpperCase();

  const prefix =
    "RS-DON-";

  const raw =
    normalized.startsWith(
      prefix,
    )
      ? normalized.slice(
          prefix.length,
        )
      : normalized;

  const id =
    raw.toLowerCase();

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
    ? id
    : null;
}

function capabilityExpired(
  createdAt: Date | null,
) {
  if (!createdAt) {
    return true;
  }

  const age =
    Date.now() -
    createdAt.getTime();

  if (age < -5 * 60 * 1000) {
    return true;
  }

  return (
    age >
    CAPABILITY_MAX_AGE_MS
  );
}

function logDonationSubscriptionFailure(
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

async function authorizeDonationCapability(
  reference: string,
  capabilityToken: string,
  options?: {
    allowExpired?: boolean;
  },
) {
  const donationId =
    parseDonationReference(
      reference,
    );

  if (!donationId) {
    return {
      ok: false as const,
      status:
        "invalid_reference" as const,
      donation: null,
    };
  }

  const [
    donation,
  ] =
    await db
      .select({
        id:
          donations.id,
        status:
          donations.status,
        capabilityHash:
          donations.notificationCapabilityHash,
        capabilityCreatedAt:
          donations.notificationCapabilityCreatedAt,
      })
      .from(
        donations,
      )
      .where(
        eq(
          donations.id,
          donationId,
        ),
      )
      .limit(1);

  if (!donation) {
    return {
      ok: false as const,
      status:
        "not_found" as const,
      donation: null,
    };
  }

  if (
    !donation.capabilityHash ||
    !donation.capabilityCreatedAt
  ) {
    return {
      ok: false as const,
      status:
        "unauthorized" as const,
      donation: null,
    };
  }

  if (
    !options?.allowExpired &&
    capabilityExpired(
      donation.capabilityCreatedAt,
    )
  ) {
    return {
      ok: false as const,
      status:
        "expired" as const,
      donation: null,
    };
  }

  const verified =
    verifyDonationNotificationCapability(
      capabilityToken,
      donation.capabilityHash,
    );

  if (!verified) {
    return {
      ok: false as const,
      status:
        "unauthorized" as const,
      donation: null,
    };
  }

  return {
    ok: true as const,
    status:
      "ok" as const,
    donation,
  };
}

export async function attachDonationPushSubscriptionBestEffort(
  input: DonationPushSubscriptionInput,
): Promise<DonationPushMutationResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      ok: false,
      status:
        "disabled",
    };
  }

  try {
    const authorization =
      await authorizeDonationCapability(
        input.reference,
        input.capabilityToken,
      );

    if (!authorization.ok) {
      return {
        ok: false,
        status:
          authorization.status,
      };
    }

    if (
      authorization.donation.status !==
      "PENDING"
    ) {
      return {
        ok: false,
        status:
          "finalized",
      };
    }

    const endpointHash =
      hashNotificationValue(
        input.endpoint,
      );

    const now =
      new Date();

    const subscriptionId =
      await db.transaction(
      async (tx) => {
        const [
          subscription,
        ] =
          await tx
            .insert(
              pushSubscriptions,
            )
            .values({
              endpointHash,
              endpoint:
                input.endpoint,
              p256dh:
                input.p256dh,
              auth:
                input.auth,
              isActive:
                true,
              failureCount:
                0,
              lastFailureAt:
                null,
              updatedAt:
                now,
            })
            .onConflictDoUpdate({
              target:
                pushSubscriptions.endpointHash,
              set: {
                endpoint:
                  input.endpoint,
                p256dh:
                  input.p256dh,
                auth:
                  input.auth,
                isActive:
                  true,
                failureCount:
                  0,
                lastFailureAt:
                  null,
                updatedAt:
                  now,
              },
            })
            .returning({
              id:
                pushSubscriptions.id,
            });

        if (!subscription) {
          throw new Error(
            "Push subscription tidak tersedia setelah upsert.",
          );
        }

        await tx
          .insert(
            donationPushSubscriptions,
          )
          .values({
            donationId:
              authorization.donation.id,
            pushSubscriptionId:
              subscription.id,
          })
          .onConflictDoNothing();

        return subscription.id;
      },
    );

    const [
      currentDonation,
    ] =
      await db
        .select({
          status:
            donations.status,
        })
        .from(
          donations,
        )
        .where(
          eq(
            donations.id,
            authorization.donation.id,
          ),
        )
        .limit(1);

    if (!currentDonation) {
      return {
        ok: false,
        status:
          "not_found",
      };
    }

    if (
      currentDonation.status !==
      "PENDING"
    ) {
      try {
        await db
          .delete(
            donationPushSubscriptions,
          )
          .where(
            and(
              eq(
                donationPushSubscriptions.donationId,
                authorization.donation.id,
              ),
              eq(
                donationPushSubscriptions.pushSubscriptionId,
                subscriptionId,
              ),
            ),
          );
      } catch (error) {
        logDonationSubscriptionFailure(
          "cleanup_finalized_donation_subscription",
          error,
        );
      }

      return {
        ok: false,
        status:
          "finalized",
      };
    }

    return {
      ok: true,
      status: "ok",
    };
  } catch (error) {
    logDonationSubscriptionFailure(
      "attach_donation_subscription",
      error,
    );

    return {
      ok: false,
      status:
        "unavailable",
    };
  }
}

export async function detachDonationPushSubscriptionBestEffort(
  input: DonationPushDetachInput,
): Promise<DonationPushMutationResult> {
  if (
    !notificationsEnabled()
  ) {
    return {
      ok: false,
      status:
        "disabled",
    };
  }

  try {
    const authorization =
      await authorizeDonationCapability(
        input.reference,
        input.capabilityToken,
        {
          allowExpired: true,
        },
      );

    if (!authorization.ok) {
      return {
        ok: false,
        status:
          authorization.status,
      };
    }

    const endpointHash =
      hashNotificationValue(
        input.endpoint,
      );

    const [
      subscription,
    ] =
      await db
        .select({
          id:
            pushSubscriptions.id,
        })
        .from(
          pushSubscriptions,
        )
        .where(
          eq(
            pushSubscriptions.endpointHash,
            endpointHash,
          ),
        )
        .limit(1);

    if (!subscription) {
      return {
        ok: true,
        status: "ok",
      };
    }

    await db
      .delete(
        donationPushSubscriptions,
      )
      .where(
        and(
          eq(
            donationPushSubscriptions.donationId,
            authorization.donation.id,
          ),
          eq(
            donationPushSubscriptions.pushSubscriptionId,
            subscription.id,
          ),
        ),
      );

    return {
      ok: true,
      status: "ok",
    };
  } catch (error) {
    logDonationSubscriptionFailure(
      "detach_donation_subscription",
      error,
    );

    return {
      ok: false,
      status:
        "unavailable",
    };
  }
}
