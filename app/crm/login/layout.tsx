import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesion",
};

export default function CrmLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
