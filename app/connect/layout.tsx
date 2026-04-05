import type { Metadata } from "next";
import ConnectClientLayout from "./ConnectClientLayout";

export const metadata: Metadata = {
  title: {
    default: "CFC Casanova",
    template: "%s | CFC",
  },
};

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConnectClientLayout>{children}</ConnectClientLayout>;
}
