import {
  randomUUID,
} from "node:crypto";

import NextAuth from "next-auth";
import {
  NextResponse,
} from "next/server";

import {
  authConfig,
} from "./auth.config";

const {
  auth,
} = NextAuth(
  authConfig,
);

function createContentSecurityPolicy(
  nonce: string,
) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://vercel-storage.com https://*.vercel-storage.com",
    "frame-src https://www.tiktok.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com https://player.vimeo.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}

export default auth(
  (request) => {
    const nonce =
      randomUUID();

    const contentSecurityPolicy =
      createContentSecurityPolicy(
        nonce,
      );

    /*
     * Next.js reads the nonce from the request CSP while rendering
     * framework-generated scripts. x-nonce is also forwarded for
     * application code that may need the same request nonce later.
     */
    const requestHeaders =
      new Headers(
        request.headers,
      );

    requestHeaders.set(
      "x-nonce",
      nonce,
    );

    requestHeaders.set(
      "Content-Security-Policy",
      contentSecurityPolicy,
    );

    const response =
      NextResponse.next({
        request: {
          headers:
            requestHeaders,
        },
      });

    /*
     * Keep the rollout non-enforcing until Preview verification is
     * complete. style-src intentionally retains unsafe-inline for now.
     */
    response.headers.set(
      "Content-Security-Policy-Report-Only",
      contentSecurityPolicy,
    );

    return response;
  },
);

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
