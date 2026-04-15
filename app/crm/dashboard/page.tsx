import type { Metadata } from "next";
import Dashboard from "@crm/pages/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function CrmDashboardPage() {
  return <Dashboard />;
}
