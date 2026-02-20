import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // Query directly — bypass getUserByEmail to isolate the issue
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    console.log("Supabase result:", { data, error })

    if (error || !data) {
      return NextResponse.json({ error: "User not found", detail: error?.message }, { status: 401 })
    }

    if (!data.active) {
      return NextResponse.json({ error: "Account suspended", suspended: true }, { status: 403 })
    }

    const { password_hash, ...safeUser } = data
    return NextResponse.json({ user: safeUser })

  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}