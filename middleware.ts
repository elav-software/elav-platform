import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {

  const url = request.nextUrl

  const isCrmRoute = url.pathname.startsWith("/crm")
  const isCrmLogin = url.pathname.startsWith("/crm/login")

  if (isCrmRoute && !isCrmLogin) {

    const token = request.cookies.get("sb-access-token")

    if (!token) {

      return NextResponse.redirect(new URL("/crm/login", request.url))

    }

  }

  return NextResponse.next()

}
