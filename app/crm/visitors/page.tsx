import type { Metadata } from "next";
import Visitors from "@crm/pages/Visitors";

export const metadata: Metadata = {
  title: "Visitantes",
};

export default function CrmVisitorsPage() {
  return <Visitors />;
}
