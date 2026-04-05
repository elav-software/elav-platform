import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing + auth guard
 *
 * Subdomain → root path mapping:
 *   cfccasanova.com (no subdomain / www) → /connect/home (public church website)
 *   censo.cfccasanova.com  → /lider        (census form for leaders)
 *   portal.cfccasanova.com → /portal/*     (leaders portal, auth required)
 *   crm.cfccasanova.com    → /crm/*        (admin CRM, auth required)
 *
 * On localhost the subdomain detection is skipped — paths are used directly.
 */

// Supabase stores the session cookie as sb-<project-ref>-auth-token
// Derive the project ref from the public env var at build time.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];
const SESSION_COOKIE = `sb-${PROJECT_REF}-auth-token`;

function hasSession(request: NextRequest): boolean {
  // Supabase stores JSON in the cookie; just checking existence is enough
  // for the middleware guard. The real auth check happens client-side.
  return (
    request.cookies.has(SESSION_COOKIE) ||
    request.cookies.has("sb-access-token") // legacy fallback
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Skip all Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── Detect subdomain ──────────────────────────────────────────────────────
  const isLocalhost =
    hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  let subdomain: string | null = null;

  if (!isLocalhost) {
    // e.g. "crm.cfccasanova.com" → "crm"
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }

  // ── Subdomain rewrites ────────────────────────────────────────────────────

  // censo.cfccasanova.com → /lider (census form)
  if (subdomain === "censo") {
    const url = request.nextUrl.clone();
    if (!pathname.startsWith("/lider")) {
      url.pathname = "/lider";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // portal.cfccasanova.com/* → /portal/*
  if (subdomain === "portal") {
    // Auth guard: redirect to /login if no session
    if (pathname !== "/login" && !pathname.startsWith("/portal")) {
      if (!hasSession(request)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const url = request.nextUrl.clone();
      url.pathname = "/portal" + (pathname === "/" ? "" : pathname);
      url.search = search;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // crm.cfccasanova.com/* → /crm/*
  // No cookie-based auth guard here — Supabase JS uses localStorage, not cookies.
  // Auth is enforced client-side by Layout.jsx (shows "Acceso no autorizado").
  if (subdomain === "crm") {
    const url = request.nextUrl.clone();

    // Already on a /crm/* path — let it through
    if (pathname.startsWith("/crm")) {
      return NextResponse.next();
    }

    // / or any other path → redirect to /crm/login
    url.pathname = pathname === "/" || pathname === "" ? "/crm/login" : "/crm" + pathname;
    url.search = search;
    return NextResponse.redirect(url);
  }

  // ── localhost / direct-path access (no subdomain) ─────────────────────────
  // On localhost Supabase stores the session in localStorage (not cookies),
  // so cookie-based guards always fail. Skip them here — auth is enforced
  // client-side by AuthContext.jsx instead.
  if (isLocalhost) {
    return NextResponse.next();
  }

  // cfccasanova.com (no subdomain) and www.cfccasanova.com → /connect/*
  // This is the main public church website.
  if (!subdomain || subdomain === "www") {
    const url = request.nextUrl.clone();
    if (pathname === "/" || pathname === "") {
      url.pathname = "/connect/home";
      return NextResponse.redirect(url);
    }
    if (!pathname.startsWith("/connect")) {
      url.pathname = "/connect" + pathname;
      url.search = search;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Protect /portal: redirect to /login if no session
  if (pathname.startsWith("/portal") && !hasSession(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect /crm/* except /crm/login
  if (pathname.startsWith("/crm") && !pathname.startsWith("/crm/login")) {
    if (!hasSession(request)) {
      return NextResponse.redirect(new URL("/crm/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals:
     *   _next/static, _next/image, favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
