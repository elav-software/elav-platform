import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16.
  // Path aliases (@crm/*, @connect/*) are resolved automatically from tsconfig.json paths.
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'qtrypzzcjebvfcihiynt.supabase.co' },
      { protocol: 'https', hostname: 'media.base44.com' },
    ],
  },
};

export default nextConfig;
