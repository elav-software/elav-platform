import type { Metadata } from "next";
import Members from "@crm/pages/Members";

export const metadata: Metadata = {
  title: "Miembros",
};

export default function CrmMembersPage() {
  return <Members />;
}
