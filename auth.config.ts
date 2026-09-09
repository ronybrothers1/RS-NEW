import type { NextAuthConfig } from "next-auth";

const isProd =
  process.env.NODE_ENV === "production";

const isBuild =
  process.env.npm_lifecycle_event ===
  "build";

if (!process.env.AUTH_SECRET) {
  if (isProd && !isBuild) {
    throw new Error(
      "AUTH_SECRET environment variable is missing. Wajib diisi untuk keamanan.",
    );
  }

  console.warn(
    "⚠️ Peringatan: AUTH_SECRET belum diatur. Menggunakan nilai bawaan. Jangan gunakan di Production.",
  );
}

export const authConfig = {
  secret:
    process.env.AUTH_SECRET ||
    "fallback_secret_for_build",

  trustHost: true,

  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized({
      auth,
      request: { nextUrl },
    }) {
      const pathname =
        nextUrl.pathname;

      const isLoggedIn =
        Boolean(auth?.user);

      const role = (
        auth?.user as
          | { role?: string }
          | undefined
      )?.role;

      const isStaff =
        role === "ADMIN" ||
        role === "OPERATOR";

      const isPublicUser =
        role === "USER";

      const isAdminRoute =
        pathname.startsWith(
          "/admin",
        );

      const isAccountRoute =
        pathname.startsWith(
          "/akun",
        );

      const isLoginPage =
        pathname === "/login";

      const isRegisterPage =
        pathname === "/register";

      if (isAdminRoute) {
        if (!isLoggedIn) {
          return false;
        }

        if (!isStaff) {
          return Response.redirect(
            new URL(
              "/akun",
              nextUrl,
            ),
          );
        }

        return true;
      }

      if (isAccountRoute) {
        if (!isLoggedIn) {
          return false;
        }

        if (!isPublicUser) {
          return Response.redirect(
            new URL(
              "/admin/dashboard",
              nextUrl,
            ),
          );
        }

        return true;
      }

      if (
        (isLoginPage ||
          isRegisterPage) &&
        isLoggedIn
      ) {
        return Response.redirect(
          new URL(
            isPublicUser
              ? "/akun"
              : "/admin/dashboard",
            nextUrl,
          ),
        );
      }

      return true;
    },

    async jwt({
      token,
      user,
    }) {
      if (user) {
        token.id = user.id;
        token.role = (
          user as {
            role?: string;
          }
        ).role;
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        session.user.id =
          token.id as string;

        (
          session.user as {
            role?: string;
          }
        ).role =
          token.role as string;
      }

      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;