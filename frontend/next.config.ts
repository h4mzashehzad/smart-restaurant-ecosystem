import type { NextConfig } from "next";

// BACKEND_URL is a server-side variable (no NEXT_PUBLIC_ prefix).
// Local dev:  set in .env.local  → BACKEND_URL=http://smart-restaurant-ecosystem.test
// Production: set in Vercel Dashboard → BACKEND_URL=https://YOUR_BACKEND_DOMAIN
const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://smart-restaurant-ecosystem.test";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // allowedDevOrigins is only meaningful in development (Next.js ignores it
  // in production). Keeping it here for local LAN access from phones/tablets.
  ...(!isProd && {
    allowedDevOrigins: [
      "192.168.18.88",
      "192.168.0.0/16",
      "192.168.18.23",
      "localhost:3000",
    ],
  }),

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // In production (Vercel): proxies to the VPS backend over HTTPS.
        // In local dev: proxies to the Valet/Herd .test domain.
        // The phone/browser never calls the backend directly — all API
        // traffic flows through this Next.js server-side rewrite.
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
      // S3 bucket for production uploaded images
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
