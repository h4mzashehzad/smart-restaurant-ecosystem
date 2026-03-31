import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Allow the phone's LAN IP to load Next.js HMR/dev resources without
  // cross-origin warnings (Next.js 16+ requirement).
  allowedDevOrigins: [
    '192.168.18.88',  // Your Mac's current LAN IP — update if it changes
    '192.168.0.0/16', // Whole 192.168.x.x subnet for convenience
    '192.168.18.23',
    'localhost:3000',
  ],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Runs SERVER-SIDE on your Mac — so the Valet/Herd .test domain
        // resolves here just fine. The phone never contacts .test directly;
        // it hits your Mac's Next.js server which proxies through to Laravel.
        destination: 'http://smart-restaurant-ecosystem.test/api/:path*',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
      },
    ],
  },
};

export default nextConfig;
