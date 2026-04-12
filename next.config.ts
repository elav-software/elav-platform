import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Path aliases (@crm/*, @connect/*) are resolved automatically from tsconfig.json paths.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'qtrypzzcjebvfcihiynt.supabase.co' },
    ],
  },
};

export default nextConfig;
