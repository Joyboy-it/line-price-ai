import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
      },
      {
        protocol: 'https',
        hostname: 'sprofile.line-scdn.net',
      },
      {
        protocol: 'https',
        hostname: 'obs.line-scdn.net',
      },
    ],
  },
  async headers() {
    return [
      {
        // รูปภาพใน public folder — ให้ revalidate ทุกครั้ง
        source: '/:path*(png|jpg|jpeg|ico|svg|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
