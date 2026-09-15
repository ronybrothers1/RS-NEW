import type {
  NextConfig,
} from "next";

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://vercel-storage.com https://*.vercel-storage.com",
  "frame-src https://www.tiktok.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com https://player.vimeo.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  {
    key:
      "Content-Security-Policy-Report-Only",
    value:
      contentSecurityPolicyReportOnly,
  },
  {
    key:
      "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key:
      "X-Frame-Options",
    value: "DENY",
  },
  {
    key:
      "Referrer-Policy",
    value:
      "strict-origin-when-cross-origin",
  },
  {
    key:
      "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=()",
  },
  {
    key:
      "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
];

const noIndexHeaders = [
  {
    key:
      "X-Robots-Tag",
    value:
      "noindex, nofollow",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    deviceSizes: [
      640,
      700,
      750,
      828,
      1080,
      1200,
      1440,
      1600,
      1920,
      2048,
      3840,
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname:
          "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/media/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/galeri",
        destination: "/kegiatan",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers:
          securityHeaders,
      },
      {
        source: "/login",
        headers:
          noIndexHeaders,
      },
      {
        source: "/register",
        headers:
          noIndexHeaders,
      },
      {
        source:
          "/lupa-password",
        headers:
          noIndexHeaders,
      },
      {
        source:
          "/lupa-password/:path*",
        headers:
          noIndexHeaders,
      },
      {
        source:
          "/verifikasi-email",
        headers:
          noIndexHeaders,
      },
      {
        source: "/akun",
        headers:
          noIndexHeaders,
      },
      {
        source:
          "/akun/:path*",
        headers:
          noIndexHeaders,
      },
      {
        source: "/admin",
        headers:
          noIndexHeaders,
      },
      {
        source:
          "/admin/:path*",
        headers:
          noIndexHeaders,
      },
    ];
  },

  output: "standalone",

  transpilePackages: [
    "motion",
  ],

  webpack: (
    config,
    {
      dev,
    },
  ) => {
    if (
      dev &&
      process.env
        .DISABLE_HMR ===
        "true"
    ) {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    return config;
  },
};

export default nextConfig;
