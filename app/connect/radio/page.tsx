import type { Metadata } from "next";
import Radio from "@connect/pages/Radio";

export const metadata: Metadata = {
  title: "Radio",
};

export default function RadioPage() {
  return <Radio />;
}
