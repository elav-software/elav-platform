import type { Metadata } from "next";
import Events from "@connect/pages/Events";

export const metadata: Metadata = {
  title: "Eventos",
};

export default function EventsPage() {
  return <Events />;
}
