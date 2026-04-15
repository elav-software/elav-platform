import { redirect } from "next/navigation";

// Legacy entry point — the real portal is at /connect/portal/dashboard
export default function Portal() {
  redirect("/connect/portal/dashboard");
}
