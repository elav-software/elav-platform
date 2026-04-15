import type { Metadata } from "next";
import Live from "@connect/pages/Live";

export const metadata: Metadata = {
  title: "En Vivo",
};

export default function LivePage() {
  return <Live />;
}
