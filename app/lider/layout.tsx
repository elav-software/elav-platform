import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Líderes CFC",
};

export default function LiderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
