import type { Metadata } from "next";
import Donations from "@crm/pages/Donations";

export const metadata: Metadata = {
  title: "Finanzas",
};

export default function CrmDonationsPage() {
  return <Donations />;
}
