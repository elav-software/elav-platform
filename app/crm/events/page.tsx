import type { Metadata } from "next";
import Events from "@crm/pages/Events";

export const metadata: Metadata = {
  title: "Eventos",
};

export default function CrmEventsPage() {
  return <Events />;
}
