import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Censo Lideres | CFC",
};

export default function LiderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
