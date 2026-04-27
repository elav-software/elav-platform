"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@crm/lib/query-client";
import { AuthProvider } from "@crm/lib/AuthContext";
import { Toaster } from "@crm/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import CrmShell from "@crm/CrmShell";

export default function CrmClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <CrmShell>{children}</CrmShell>
        <Toaster />
        <HotToaster position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
