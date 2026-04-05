"use client";
import dynamic from "next/dynamic";

const ConnectClientProviders = dynamic(
  () => import("./ConnectClientProviders"),
  { ssr: false }
);

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConnectClientProviders>{children}</ConnectClientProviders>;
}
