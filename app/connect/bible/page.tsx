import type { Metadata } from "next";
import Bible from "@connect/pages/Bible";

export const metadata: Metadata = {
  title: "Biblia",
};

export default function BiblePage() {
  return <Bible />;
}
