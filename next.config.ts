import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Path aliases (@crm/*, @connect/*) are resolved automatically from tsconfig.json paths.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  // beforeFiles: corre ANTES de que Next.js chequee páginas o archivos.
  // Sirve la landing estática en "/" sin cambiar la URL del browser.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/landing/index.html",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
