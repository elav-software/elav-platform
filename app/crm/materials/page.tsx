import type { Metadata } from "next";
import Materials from "@crm/pages/Materials";

export const metadata: Metadata = {
  title: "Materiales | CRM",
};

export default function MaterialsPage() {
  return <Materials />;
}
