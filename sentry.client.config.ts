import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Captura el 10% de las sesiones para ver pasos previos al error (Session Replay)
  // Sube a 1.0 si querés ver todas las sesiones con error
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      // Oculta texto e inputs para no capturar datos sensibles (emails, contraseñas)
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // No registra errores en desarrollo local
  enabled: process.env.NODE_ENV === "production",

  // Ignora errores de red comunes que no son bugs reales
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network Error",
    "Load failed",
    "Failed to fetch",
  ],
});
