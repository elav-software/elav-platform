import type { Metadata } from "next";
import CrmClientLayout from "./CrmClientLayout";

export const metadata: Metadata = {
  title: {
    default: "CRM",
    template: "%s | CRM CFC",
  },
};

export default function CrmShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CrmClientLayout>{children}</CrmClientLayout>;
}
