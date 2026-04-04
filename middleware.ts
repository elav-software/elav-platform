import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {

  const url = request.nextUrl

  if (url.pathname.startsWith("/crm")) {

    const token = request.cookies.get("sb-access-token")

    if (!token) {

      return NextResponse.redirect(new URL("/crm/login", request.url))

    }

  }

  return NextResponse.next()

}
