import NextAuth from "next-auth";

import Credentials from "next-auth/providers/credentials";

import {
  compare,
} from "bcryptjs";

import {
  eq,
  ilike,
} from "drizzle-orm";

import {
  authConfig,
} from "./auth.config";

import { db } from "./src/db";

import {
  users,
} from "./src/db/schema";

import {
  verifyEmailVerificationLoginToken,
} from "./lib/email-verification";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      id: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(
        credentials,
      ) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const email = String(
          credentials.email,
        ).trim();

        const userRecord =
          await db.query.users.findFirst(
            {
              where: ilike(
                users.email,
                email,
              ),
            },
          );

        if (!userRecord) {
          return null;
        }

        const valid =
          await compare(
            String(
              credentials.password,
            ),
            userRecord.passwordHash,
          );

        if (!valid) {
          return null;
        }

        if (
          userRecord.role ===
            "USER" &&
          !userRecord.emailVerifiedAt
        ) {
          return null;
        }

        return {
          id: userRecord.id,
          name: userRecord.name,
          email:
            userRecord.email,
          role:
            userRecord.role,
        };
      },
    }),

    Credentials({
      id: "verified-email",

      credentials: {
        token: {
          label: "Token",
          type: "text",
        },
      },

      async authorize(
        credentials,
      ) {
        const token =
          String(
            credentials?.token ||
              "",
          );

        const userId =
          verifyEmailVerificationLoginToken(
            token,
          );

        if (!userId) {
          return null;
        }

        const [userRecord] =
          await db
            .select()
            .from(users)
            .where(
              eq(
                users.id,
                userId,
              ),
            )
            .limit(1);

        if (
          !userRecord ||
          userRecord.role !==
            "USER" ||
          !userRecord.emailVerifiedAt
        ) {
          return null;
        }

        return {
          id: userRecord.id,
          name: userRecord.name,
          email:
            userRecord.email,
          role:
            userRecord.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
});