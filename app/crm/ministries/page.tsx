import type { Metadata } from "next";
import Ministries from "@crm/pages/Ministries";

export const metadata: Metadata = {
  title: "Ministerios",
};

export default function CrmMinistriesPage() {
  return <Ministries />;
}
