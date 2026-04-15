import type { Metadata } from "next";
import Prayer from "@connect/pages/Prayer";

export const metadata: Metadata = {
  title: "Oración",
};

export default function PrayerPage() {
  return <Prayer />;
}
