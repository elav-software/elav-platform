"use client";

/**
 * router-compat.ts
 *
 * Shim que expone la misma API de react-router-dom (useNavigate, useLocation, Link)
 * pero internamente usa Next.js App Router.
 * Esto permite que el código original del CRM funcione sin modificaciones.
 */

import { useRouter, usePathname } from "next/navigation";
import NextLink from "next/link";
import React from "react";

// Link que acepta tanto `href` (Next.js) como `to` (react-router-dom)
export function Link({
  to,
  href,
  children,
  ...props
}: React.ComponentProps<typeof NextLink> & { to?: string }) {
  return React.createElement(NextLink, { href: (href ?? to) as string, ...props }, children);
}

// Reemplaza useNavigate de react-router-dom
export function useNavigate() {
  const router = useRouter();
  return (
    to: string,
    options?: { replace?: boolean; state?: unknown }
  ) => {
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

// Reemplaza useLocation de react-router-dom
export function useLocation() {
  const pathname = usePathname();
  return {
    pathname,
    search: typeof window !== "undefined" ? window.location.search : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
  };
}
