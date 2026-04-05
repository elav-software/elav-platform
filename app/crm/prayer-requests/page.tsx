import type { Metadata } from "next";
import PrayerRequests from "@crm/pages/PrayerRequests";

export const metadata: Metadata = {
  title: "Peticiones",
};

export default function CrmPrayerRequestsPage() {
  return <PrayerRequests />;
}
