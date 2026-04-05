// Maps a page name (e.g. "Home", "MyNotes") to a /connect/<slug> URL
const PAGE_SLUGS: Record<string, string> = {
  Home: '/connect/home',
  Live: '/connect/live',
  Bible: '/connect/bible',
  Prayer: '/connect/prayer',
  Give: '/connect/give',
  Sermons: '/connect/sermons',
  Devotionals: '/connect/devotionals',
  Events: '/connect/events',
  Announcements: '/connect/announcements',
  Radio: '/connect/radio',
  Counseling: '/connect/counseling',
  MyNotes: '/connect/my-notes',
  LeadershipMaterials: '/connect/leadership',
  MinistryReports: '/connect/ministry-reports',
  AdminDashboard: '/connect/admin',
  AdminAnnouncements: '/connect/admin/announcements',
  AdminDevotionals: '/connect/admin/devotionals',
  AdminEvents: '/connect/admin/events',
  AdminSermons: '/connect/admin/sermons',
  AdminServices: '/connect/admin/services',
};

export function createPageUrl(pageName: string): string {
  return PAGE_SLUGS[pageName] ?? '/connect/home';
}