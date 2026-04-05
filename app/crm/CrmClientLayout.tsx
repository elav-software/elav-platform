"use client";
// The CRM uses browser-only APIs (window, localStorage).
// ssr: false prevents any CRM code from running on the server.
import dynamic from "next/dynamic";

const CrmClientProviders = dynamic(
  () => import("./CrmClientProviders"),
  { ssr: false }
);

export default function CrmClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CrmClientProviders>{children}</CrmClientProviders>;
}
