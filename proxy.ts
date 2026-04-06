import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware de routing multi-tenant — sin configuración por iglesia.
 *
 * Cada iglesia tiene UN dominio propio (ej: miiglesia.com).
 * El routing a los módulos se hace por subdominio:
 *
 *   miiglesia.com              → /connect/home   (web pública)
 *   www.miiglesia.com          → /connect/home   (web pública)
 *   crm.miiglesia.com          → /crm/*          (CRM)
 *   censo.miiglesia.com        → /lider          (formulario censo)
 *
 * Para agregar una iglesia nueva: solo registrarla en la tabla `churches`
 * de Supabase + apuntar su DNS a este servidor. Sin cambios de código.
 *
 * La identificación de la iglesia (church_id) se resuelve en el cliente
 * consultando la columna `custom_domain` de la tabla `churches`.
 *
 * ── Localhost (desarrollo) ─────────────────────────────────────────────────
 *   Acceder directamente por ruta: /connect/home, /crm/dashboard, etc.
 *   El church puede pasarse como ?church=cfc (o via NEXT_PUBLIC_DEFAULT_CHURCH_SLUG)
 */

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLocalhost =
    hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  // ── LOCALHOST: pasar directamente, acceder por ruta ─────────────────────
  if (isLocalhost) {
    return NextResponse.next();
  }

  // Obtener el primer subdominio (antes del primer punto)
  const sub = hostname.split(".")[0].toLowerCase();

  // ── crm.miiglesia.com → módulo CRM ───────────────────────────────────────
  if (sub === "crm") {
    if (pathname.startsWith("/crm")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/crm/login" : "/crm" + pathname;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // ── censo.miiglesia.com → formulario de censo ────────────────────────────
  if (sub === "censo") {
    if (pathname.startsWith("/lider") || pathname.startsWith("/miembros")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/lider";
    return NextResponse.redirect(url);
  }

  // ── miiglesia.com / www.miiglesia.com → web pública (Connect) ───────────
  if (pathname === "/" || pathname === "") {
    const url = request.nextUrl.clone();
    url.pathname = "/connect/home";
    return NextResponse.redirect(url);
  }

  if (
    !pathname.startsWith("/connect") &&
    !pathname.startsWith("/crm") &&
    !pathname.startsWith("/lider") &&
    !pathname.startsWith("/miembros") &&
    !pathname.startsWith("/superadmin")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/connect" + pathname;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
