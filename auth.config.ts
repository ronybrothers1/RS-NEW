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

      const sessionUser = (
        auth?.user as
          | {
              role?: string;
              sessionVersion?: unknown;
            }
          | undefined
      );

      const sessionVersion =
        sessionUser?.sessionVersion;

      const hasValidSessionVersion =
        typeof sessionVersion ===
          "number" &&
        Number.isInteger(
          sessionVersion,
        ) &&
        sessionVersion >= 0;

      const isLoggedIn =
        Boolean(auth?.user) &&
        hasValidSessionVersion;

      const role =
        sessionUser?.role;

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

      /*
       * When auth() wraps custom middleware, an explicit Response
       * must short-circuit before the nonce middleware runs.
       * Preserve the previous sign-in callback URL semantics.
       */
      const redirectToLogin =
        () => {
          const signInUrl =
            new URL(
              "/login",
              nextUrl,
            );

          signInUrl.searchParams.set(
            "callbackUrl",
            nextUrl.href,
          );

          return Response.redirect(
            signInUrl,
            307,
          );
        };

      if (isAdminRoute) {
        if (!isLoggedIn) {
          return redirectToLogin();
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
          return redirectToLogin();
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

      // Middleware intentionally remains DB-free, so it cannot
      // prove that an existing JWT sessionVersion still matches
      // the current database value. Always allow the login page
      // so a DB-revoked session can recover without a redirect loop.
      if (isLoginPage) {
        return true;
      }

      if (
        isRegisterPage &&
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
        const authenticatedUser =
          user as {
            role?: string;
            sessionVersion?: number;
          };

        token.id = user.id;
        token.role =
          authenticatedUser.role;
        token.sessionVersion =
          authenticatedUser.sessionVersion;
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

        const sessionUser =
          session.user as {
            role?: string;
            sessionVersion?: number;
          };

        sessionUser.role =
          token.role as string;

        sessionUser.sessionVersion =
          token.sessionVersion as
            | number
            | undefined;
      }

      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;