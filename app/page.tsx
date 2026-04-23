import { redirect } from "next/navigation";

/**
 * Root page — en producción Vercel reescribe "/" a "/landing/index.html"
 * (ver vercel.json). Este redirect es solo fallback para desarrollo local.
 */
export default function RootPage() {
  redirect("/landing/index.html");
}
