"use client";

import { usePathname } from "next/navigation";
import Layout from "@crm/Layout";

const PATH_TO_PAGE: Record<string, string> = {
  "/crm/dashboard":       "Dashboard",
  "/crm/members":         "Members",
  "/crm/visitors":        "Visitors",
  "/crm/leaders":         "Leaders",
  "/crm/cell-submissions": "CellSubmissions",
  "/crm/ministries":      "Ministries",
  "/crm/events":          "Events",
  "/crm/prayer-requests": "PrayerRequests",
  "/crm/donations":       "Donations",
  "/crm/demographics":    "Demographics",
  "/crm/communication":   "Communication",
  "/crm/surveys":         "Surveys",
  "/crm/login":           "Welcome",
};

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPageName = PATH_TO_PAGE[pathname];

  // Login page: render without sidebar
  if (pathname === "/crm/login") {
    return <>{children}</>;
  }

  return <Layout currentPageName={currentPageName}>{children}</Layout>;
}
