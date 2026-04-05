import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {

  const url = request.nextUrl

  const isCrmRoute = url.pathname.startsWith("/crm")
  const isCrmLogin = url.pathname.startsWith("/crm/login")

  if (isCrmRoute && !isCrmLogin) {

    const auth = request.cookies.get("crm-auth")

    if (!auth) {

      return NextResponse.redirect(new URL("/crm/login", request.url))

    }

  }

  return NextResponse.next()

}

export const config = {
  matcher: ['/crm/:path*'],
}
