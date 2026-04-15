import type { Metadata } from "next";
import Demographics from "@crm/pages/Demographics";

export const metadata: Metadata = {
  title: "Demografia",
};

export default function CrmDemographicsPage() {
  return <Demographics />;
}
