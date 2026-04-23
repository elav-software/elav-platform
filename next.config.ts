import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Path aliases (@crm/*, @connect/*) are resolved automatically from tsconfig.json paths.
  async rewrites() {
    return [
      { source: "/landing", destination: "/landing/index.html" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
};

export default nextConfig;
