import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const userRecord = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string)
        });

        if (!userRecord) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          userRecord.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role,
        };
      }
    })
  ],
  session: { strategy: "jwt" },
});
