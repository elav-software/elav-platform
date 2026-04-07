const PAGE_ROUTES: Record<string, string> = {
  Dashboard:      "/crm/dashboard",
  Members:        "/crm/members",
  Visitors:       "/crm/visitors",
  Leaders:        "/crm/leaders",
  CellSubmissions: "/crm/cell-submissions",
  Ministries:     "/crm/ministries",
  Events:         "/crm/events",
  PrayerRequests: "/crm/prayer-requests",
  Donations:      "/crm/donations",
  Demographics:   "/crm/demographics",
  Communication:  "/crm/communication",
  Surveys:        "/crm/surveys",
  UserManagement: "/crm/user-management",
  Welcome:        "/crm/login",
};

export function createPageUrl(pageName: string): string {
  return PAGE_ROUTES[pageName] ?? `/crm/${pageName.toLowerCase()}`;
}