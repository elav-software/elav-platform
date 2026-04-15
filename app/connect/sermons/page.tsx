import type { Metadata } from "next";
import Sermons from "@connect/pages/Sermons";

export const metadata: Metadata = {
  title: "Sermones",
};

export default function SermonsPage() {
  return <Sermons />;
}
