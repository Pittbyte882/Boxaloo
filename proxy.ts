import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const roleRoutes: Record<string, string> = {
  "/broker": "broker",
  "/carrier": "carrier",
  "/dispatcher": "dispatcher",
  "/admin": "admin",
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("boxaloo_session")

  // Not logged in — redirect to home
  if (!session) {
    const loginUrl = new URL("/", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role for dashboard routes
  const matchedRoute = Object.keys(roleRoutes).find((route) =>
    pathname.startsWith(route)
  )

  if (matchedRoute) {
    const requiredRole = roleRoutes[matchedRoute]

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from("users")
      .select("role, active, access_expires_at, subscription_status")
      .eq("id", session.value)
      .single()

    if (!user || user.role !== requiredRole) {
      const correctDash = user ? `/${user.role}` : "/"
      return NextResponse.redirect(new URL(correctDash, request.url))
    }

    // ✅ Payment wall — inside matchedRoute block where user is defined
    if (user.role === "carrier" || user.role === "dispatcher") {
      const now = new Date()
      const accessExpiresAt = user.access_expires_at
        ? new Date(user.access_expires_at)
        : null

      if (!accessExpiresAt || now > accessExpiresAt) {
        const paymentUrl = new URL("/add-payment", request.url)
        paymentUrl.searchParams.set("userId", session.value)
        return NextResponse.redirect(paymentUrl)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/broker",
    "/broker/(.*)",
    "/carrier",
    "/carrier/(.*)",
    "/dispatcher",
    "/dispatcher/(.*)",
    "/admin",
    "/admin/(.*)",
    "/loadboard",
    "/loadboard/(.*)",
  ],
}