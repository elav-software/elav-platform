"use client";

import { usePathname } from "next/navigation";
import Layout from "@connect/Layout";

// Maps /connect/<slug> → page name used in Layout & navItems
const PATH_TO_PAGE: Record<string, string> = {
  "/connect/home":             "Home",
  "/connect/live":             "Live",
  "/connect/bible":            "Bible",
  "/connect/prayer":           "Prayer",
  "/connect/give":             "Give",
  "/connect/sermons":          "Sermons",
  "/connect/devotionals":      "Devotionals",
  "/connect/events":           "Events",
  "/connect/announcements":    "Announcements",
  "/connect/radio":            "Radio",
  "/connect/counseling":       "Counseling",
  "/connect/my-notes":         "MyNotes",
  "/connect/leadership":       "LeadershipMaterials",
  "/connect/ministry-reports": "MinistryReports",
  "/connect/admin":            "AdminDashboard",
};

export default function ConnectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPageName = PATH_TO_PAGE[pathname] ?? "Home";

  return <Layout currentPageName={currentPageName}>{children}</Layout>;
}
