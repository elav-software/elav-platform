import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Miembros CFC",
};

export default function MiembrosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
