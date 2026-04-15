import type { Metadata } from "next";
import Home from "@connect/pages/Home";

export const metadata: Metadata = {
  title: "Inicio",
};

export default function HomePage() {
  return <Home />;
}
