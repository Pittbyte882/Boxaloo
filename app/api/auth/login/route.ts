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

    if (!data.active) {
      return NextResponse.json({ error: "Account suspended", suspended: true }, { status: 403 })
    }

    const passwordMatch = await bcrypt.compare(password, data.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    const { password_hash, ...safeUser } = data

    // Set session cookie after all checks pass
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