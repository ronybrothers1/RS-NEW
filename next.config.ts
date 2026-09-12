import type {
  NextConfig,
} from "next";

const securityHeaders = [
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

const nextConfig: NextConfig = {
  reactStrictMode: true,

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
