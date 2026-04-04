import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")

  if (!host) return NextResponse.next()

  if (host.startsWith("portal.")) {
    return NextResponse.rewrite(new URL("/portal", request.url))
  }

  if (host.startsWith("crm.")) {
    return NextResponse.rewrite(new URL("/crm", request.url))
  }

  if (host.startsWith("censo.")) {
    return NextResponse.rewrite(new URL("/", request.url))
  }

  return NextResponse.next()
}
