import { redirect } from "next/navigation";

// Legacy entry point — the real login is at /crm/login
export default function LoginPage() {
  redirect("/crm/login");
}
