import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import bcrypt from "bcryptjs"


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "User not found", detail: error?.message }, { status: 401 })
    }

    // Check why account is inactive and return specific error
    if (!data.active) {
      if (data.subscription_status === "past_due") {
        return NextResponse.json({
          error: "Your payment failed. Please update your payment method to reactivate your account.",
          payment_failed: true,
        }, { status: 403 })
      }
      if (data.subscription_status === "canceled") {
        return NextResponse.json({
          error: "Your subscription has been canceled.",
          canceled: true,
        }, { status: 403 })
      }
      return NextResponse.json({ error: "Account suspended", suspended: true }, { status: 403 })
    }

    const passwordMatch = await bcrypt.compare(password, data.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }
 //Check Access Expires At_//
    if (data.role === "carrier" || data.role === "dispatcher") {
  const now = new Date()
  const accessExpiresAt = data.access_expires_at
    ? new Date(data.access_expires_at)
    : null

  // No access_expires_at means trial never started — send to payment wall
  if (!accessExpiresAt || now > accessExpiresAt) {
    const { password_hash, ...safeUser } = data
    return NextResponse.json({
      error: "Your access has expired. Please make a payment to continue.",
      needs_payment: true,
      user: safeUser,
    }, { status: 403 })
  }
}
    const { password_hash, ...safeUser } = data

    const response = NextResponse.json({ user: safeUser })
    response.cookies.set("boxaloo_session", safeUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    return response

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}