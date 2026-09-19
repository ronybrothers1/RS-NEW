import type {
  Session,
} from "next-auth";

import {
  eq,
} from "drizzle-orm";

import {
  auth,
} from "@/auth";
import {
  db,
} from "@/src/db";
import {
  users,
} from "@/src/db/schema";

export type CurrentDbUser = {
  id: string;
  role:
    | "ADMIN"
    | "OPERATOR"
    | "USER";
  emailVerifiedAt:
    Date | null;
  sessionVersion:
    number;
};

export async function getCurrentDbUser(
  sessionOverride?:
    | Session
    | null,
):
Promise<CurrentDbUser | null> {
  const session =
    sessionOverride === undefined
      ? await auth()
      : sessionOverride;

  const userId =
    session?.user?.id;

  const sessionVersion = (
    session?.user as
      | {
          sessionVersion?: unknown;
        }
      | undefined
  )?.sessionVersion;

  if (
    !userId ||
    typeof sessionVersion !==
      "number" ||
    !Number.isInteger(
      sessionVersion,
    ) ||
    sessionVersion < 0
  ) {
    return null;
  }

  const [user] =
    await db
      .select({
        id: users.id,
        role: users.role,
        emailVerifiedAt:
          users.emailVerifiedAt,
        sessionVersion:
          users.sessionVersion,
      })
      .from(users)
      .where(
        eq(
          users.id,
          userId,
        ),
      )
      .limit(1);

  if (
    !user ||
    user.sessionVersion !==
      sessionVersion
  ) {
    return null;
  }

  return user;
}

export async function getCurrentStaffUser() {
  const user =
    await getCurrentDbUser();

  if (
    !user ||
    (
      user.role !== "ADMIN" &&
      user.role !== "OPERATOR"
    )
  ) {
    return null;
  }

  return user;
}

export async function getCurrentVerifiedPublicUser() {
  const user =
    await getCurrentDbUser();

  if (
    !user ||
    user.role !== "USER" ||
    !user.emailVerifiedAt
  ) {
    return null;
  }

  return user;
}
