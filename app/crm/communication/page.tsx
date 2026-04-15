import type { Metadata } from "next";
import Communication from "@crm/pages/Communication";

export const metadata: Metadata = {
  title: "Comunicacion",
};

export default function CrmCommunicationPage() {
  return <Communication />;
}
