"use client";

// Inicializa Sentry en el cliente de forma explícita.
// withSentryConfig lo inyecta automáticamente solo cuando SENTRY_AUTH_TOKEN está disponible en el build.
import * as Sentry from "@sentry/nextjs";

if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Network Error",
      "Load failed",
      "Failed to fetch",
    ],
  });
}

export default function SentryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
