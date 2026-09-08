import type { NextAuthConfig } from "next-auth";

const isProd = process.env.NODE_ENV === 'production';
const isBuild = process.env.npm_lifecycle_event === 'build';

if (!process.env.AUTH_SECRET) {
  if (isProd && !isBuild) {
    throw new Error("AUTH_SECRET environment variable is missing. Wajib diisi untuk keamanan.");
  } else {
    console.warn("⚠️ Peringatan: AUTH_SECRET belum diatur. Menggunakan nilai bawaan. Jangan gunakan di Production.");
  }
}

export const authConfig = {
  secret: process.env.AUTH_SECRET || "fallback_secret_for_build",
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isLoginPage = nextUrl.pathname === '/login';

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        return true;
      }

      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL('/admin/dashboard', nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  providers: [], // Empty here, configured in auth.ts
} satisfies NextAuthConfig;
