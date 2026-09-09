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
};

export async function getCurrentDbUser():
Promise<CurrentDbUser | null> {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  if (!userId) {
    return null;
  }

  const [user] =
    await db
      .select({
        id: users.id,
        role: users.role,
        emailVerifiedAt:
          users.emailVerifiedAt,
      })
      .from(users)
      .where(
        eq(
          users.id,
          userId,
        ),
      )
      .limit(1);

  return user || null;
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
