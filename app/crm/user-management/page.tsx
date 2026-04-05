import type { Metadata } from "next";
import UserManagement from "@crm/pages/UserManagement";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default function CrmUserManagementPage() {
  return <UserManagement />;
}
