import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16.
  // Path aliases (@crm/*) are resolved automatically from tsconfig.json paths.
  turbopack: {},
};

export default nextConfig;
