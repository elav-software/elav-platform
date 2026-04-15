import type { Metadata } from "next";
import Surveys from "@crm/pages/Surveys";

export const metadata: Metadata = {
  title: "Encuestas",
};

export default function CrmSurveysPage() {
  return <Surveys />;
}
