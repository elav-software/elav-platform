"use client";
// The CRM uses browser-only APIs (window, localStorage, @base44/sdk).
// ssr: false inside a Client Component prevents any CRM code from running on the server.
import dynamic from "next/dynamic";

const CrmClientProviders = dynamic(
  () => import("./CrmClientProviders"),
  { ssr: false }
);

export default function CrmShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CrmClientProviders>{children}</CrmClientProviders>;
}
