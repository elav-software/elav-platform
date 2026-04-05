import { redirect } from "next/navigation";

/**
 * Root page - redirects to the public church website.
 * cfccasanova.com -> /connect/home (handled by proxy.ts)
 * Direct / access -> /connect/home
 */
export default function RootPage() {
  redirect("/connect/home");
}
