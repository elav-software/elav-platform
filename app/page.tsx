import { redirect } from "next/navigation";

/**
 * Root page — el middleware.ts reescribe "/" a "/landing/index.html" en
 * producción (rewrite, la URL no cambia). En localhost redirige aquí como
 * fallback.
 */
export default function RootPage() {
  redirect("/landing/index.html");
}
