import type { Metadata } from "next";
import Leaders from "@crm/pages/Leaders";

export const metadata: Metadata = {
  title: "Lideres",
};

export default function CrmLeadersPage() {
  return <Leaders />;
}
