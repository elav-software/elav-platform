import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * proxy.ts — Next.js 16 (antes middleware.ts)
 *
 * Hace dos cosas en un solo pase:
 *   1. Auth check: rutas /crm/* (excepto /crm/login) y /connect/portal/*
 *      (excepto login/callback/set-password) requieren sesión Supabase válida.
 *      Sin sesión → redirect al login correspondiente.
 *   2. Multi-tenant routing: en producción, el subdominio determina el módulo.
 *      crm.miiglesia.com   → /crm/*
 *      censo.miiglesia.com → /lider/*
 *      miiglesia.com       → landing estática
 */

// Rutas del connect portal accesibles sin sesión
const CONNECT_PUBLIC = [
  "/connect/portal/login",
  "/connect/portal/callback",
  "/connect/portal/set-password",
];

/**
 * Construye la respuesta de routing puro (redirect/rewrite/next) sin tocar auth.
 * Separada para poder aplicarle las cookies de sesión refrescadas encima.
 */
function buildRoutingResponse(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const isLocalhost =
    hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  if (isLocalhost) return NextResponse.next();

  const sub = hostname.split(".")[0].toLowerCase();

  // crm.miiglesia.com → módulo CRM
  if (sub === "crm") {
    if (pathname.startsWith("/crm")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/crm/login" : "/crm" + pathname;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // censo.miiglesia.com → formulario de censo
  if (sub === "censo") {
    if (pathname.startsWith("/lider") || pathname.startsWith("/miembros"))
      return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/lider";
    return NextResponse.redirect(url);
  }

  // miiglesia.com / www.miiglesia.com → landing estática
  if (pathname === "/" || pathname === "") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing/index.html";
    return NextResponse.rewrite(url);
  }

  const landingPages: Record<string, string> = {
    "/soy-nuevo": "/landing/soy-nuevo.html",
    "/eventos":   "/landing/eventos.html",
    "/media":     "/landing/media.html",
    "/contacto":  "/landing/contacto.html",
  };
  if (landingPages[pathname]) {
    const url = request.nextUrl.clone();
    url.pathname = landingPages[pathname];
    return NextResponse.rewrite(url);
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Saltar assets y rutas internas de Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLocalhost =
    hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");
  const sub = isLocalhost ? "" : hostname.split(".")[0].toLowerCase();

  // ── Determinar si la request es a una ruta protegida ────────────────────
  //
  // En producción con subdominio "crm", el path /dashboard se convertirá
  // en /crm/dashboard después del routing. Calculamos el path efectivo para
  // saber si necesita auth antes de hacer el routing.
  const effectivePath =
    sub === "crm" && !pathname.startsWith("/crm")
      ? "/crm" + (pathname === "/" ? "/login" : pathname)
      : pathname;

  const needsCrmAuth =
    effectivePath.startsWith("/crm") &&
    !effectivePath.startsWith("/crm/login");

  const needsConnectAuth =
    pathname.startsWith("/connect/portal") &&
    !CONNECT_PUBLIC.some((p) => pathname.startsWith(p));

  // ── Auth check (solo rutas protegidas) ───────────────────────────────────
  if (needsCrmAuth || needsConnectAuth) {
    // Colectar cookies que Supabase quiera refrescar para aplicarlas
    // a la respuesta de routing (que puede ser un redirect o rewrite)
    const cookiesToRefresh: Array<{
      name: string;
      value: string;
      options: Parameters<ReturnType<typeof NextResponse.next>["cookies"]["set"]>[2];
    }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(items) {
            // Propagar al request (para que el server client lo vea)
            items.forEach(({ name, value }) => request.cookies.set(name, value));
            // Guardar para aplicar a la respuesta final
            cookiesToRefresh.push(...items);
          },
        },
      }
    );

    // getUser() verifica con Supabase y refresca el JWT si está por vencer.
    // No usar getSession(): lee el cookie sin verificar firma server-side.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = needsCrmAuth ? "/crm/login" : "/connect/portal/login";
      return NextResponse.redirect(url);
    }

    // Sesión válida: hacer routing y copiar cookies refrescadas a la respuesta
    const response = buildRoutingResponse(request);
    cookiesToRefresh.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  }

  // ── Sin auth requerida: solo routing ─────────────────────────────────────
  return buildRoutingResponse(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
