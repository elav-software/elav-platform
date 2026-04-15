import type { Metadata } from "next";
import Announcements from "@connect/pages/Announcements";

export const metadata: Metadata = {
  title: "Anuncios",
};

export default function AnnouncementsPage() {
  return <Announcements />;
}
