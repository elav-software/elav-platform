"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@connect/lib/query-client";
import { AuthProvider } from "@connect/lib/AuthContext";
import { Toaster } from "@connect/components/ui/sonner";
import ConnectShell from "@connect/ConnectShell";

export default function ConnectClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ConnectShell>{children}</ConnectShell>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
