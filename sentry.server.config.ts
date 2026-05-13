import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  // Captura el 10% de las transacciones de servidor para performance
  tracesSampleRate: 0.1,
});
