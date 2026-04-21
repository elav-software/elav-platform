import type { Metadata } from "next";
import ServiceAreas from "@crm/pages/ServiceAreas";

export const metadata: Metadata = {
  title: "Área de Servicios",
};

export default function CrmServiceAreasPage() {
  return <ServiceAreas />;
}
