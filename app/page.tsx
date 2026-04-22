import { redirect } from "next/navigation";

/**
 * Root page - redirects to the static landing page.
 * cfccasanova.com -> /landing/index.html
 */
export default function RootPage() {
  redirect("/landing/index.html");
}
