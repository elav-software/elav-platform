"use client";
/**
 * Minimal react-router-dom compatibility shim for Next.js App Router.
 * Only the subset of react-router-dom APIs used in the connect app.
 */
import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

export function Link({ to, href, children, onClick, className, style, ...props }) {
  return (
    <NextLink href={to || href || '/'} onClick={onClick} className={className} style={style} {...props}>
      {children}
    </NextLink>
  );
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname, search: '' };
}

export function useNavigate() {
  const router = useRouter();
  return (to, options) => router.push(to, options);
}

// No-ops not needed in Next.js App Router
export function BrowserRouter({ children }) {
  return children;
}

export function Routes({ children }) {
  return children;
}

export function Route() {
  return null;
}
