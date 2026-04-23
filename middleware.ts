import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware — routing multi-tenant.
 *
 * Subdominio  →  módulo
 *   crm.*     →  /crm/login
 *   censo.*   →  /lider
 *   www.* / * →  sirve la landing estática (rewrite a /landing/index.html)
 *
 * Localhost: pasa directo, acceder por ruta.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Dejar pasar: internals de Next.js, API routes y archivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLocalhost =
    hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  if (isLocalhost) {
    return NextResponse.next();
  }

  const sub = hostname.split(".")[0].toLowerCase();

  // crm.cfccasanova.com → CRM
  if (sub === "crm") {
    if (pathname.startsWith("/crm")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/crm/login" : "/crm" + pathname;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // censo.cfccasanova.com → formulario censo
  if (sub === "censo") {
    if (pathname.startsWith("/lider") || pathname.startsWith("/miembros")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/lider";
    return NextResponse.redirect(url);
  }

  // cfccasanova.com / www.cfccasanova.com → landing estática
  // Rewrite: la URL en el browser queda como cfccasanova.com/
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing/index.html";
    return NextResponse.rewrite(url);
  }

  // Cualquier otra ruta en el dominio principal → dejar pasar
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
