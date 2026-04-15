"use client";
import dynamic from "next/dynamic";

const ConnectClientProviders = dynamic(
  () => import("./ConnectClientProviders"),
  { ssr: false }
);

export default function ConnectClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConnectClientProviders>{children}</ConnectClientProviders>;
}
