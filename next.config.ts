import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requiere 'unsafe-inline' y 'unsafe-eval' para su runtime
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://*.tile.openstreetmap.org",
  // Supabase REST + Realtime WebSocket + Nominatim geocoding
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://nominatim.openstreetmap.org",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Equivalente a X-Frame-Options: DENY para navegadores modernos
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  // Evita que la página sea embebida en iframes (protección clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Evita que el browser "adivine" el content-type (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla qué info de referrer se envía en requests cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deshabilita features sensibles del navegador que esta app no usa
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

};

export default nextConfig;
