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
        { source: "/",          destination: "/landing/index.html" },
        { source: "/soy-nuevo", destination: "/landing/soy-nuevo.html" },
        { source: "/eventos",   destination: "/landing/eventos.html" },
        { source: "/media",     destination: "/landing/media.html" },
        { source: "/contacto",  destination: "/landing/contacto.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
