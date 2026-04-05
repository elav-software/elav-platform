import type { Metadata } from "next";
import Give from "@connect/pages/Give";

export const metadata: Metadata = {
  title: "Dar",
};

export default function GivePage() {
  return <Give />;
}
