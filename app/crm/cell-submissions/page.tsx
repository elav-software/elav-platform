import type { Metadata } from "next";
import CellSubmissions from "@crm/pages/CellSubmissions";

export const metadata: Metadata = {
  title: "Reportes de Células",
};

export default function CrmCellSubmissionsPage() {
  return <CellSubmissions />;
}
