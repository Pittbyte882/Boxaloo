import { NextRequest, NextResponse } from "next/server"

const protectedRoutes = [
  "/broker",
  "/carrier",
  "/dispatcher",
  "/admin",
  "/loadboard",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!isProtected) return NextResponse.next()

  // Check for session cookie
  const session = request.cookies.get("boxaloo_session")

  if (!session) {
    const loginUrl = new URL("/", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/broker/:path*", "/carrier/:path*", "/dispatcher/:path*", "/admin/:path*", "/loadboard/:path*"],
}