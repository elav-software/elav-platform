"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", gap: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b" }}>Algo salió mal</h2>
          <p style={{ color: "#64748b", fontSize: "14px" }}>El error fue registrado automáticamente.</p>
          <button
            onClick={reset}
            style={{ padding: "8px 20px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
