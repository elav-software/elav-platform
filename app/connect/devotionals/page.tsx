import type { Metadata } from "next";
import Devotionals from "@connect/pages/Devotionals";

export const metadata: Metadata = {
  title: "Devocionales",
};

export default function DevotionalsPage() {
  return <Devotionals />;
}
