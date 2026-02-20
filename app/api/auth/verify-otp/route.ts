import { NextRequest, NextResponse } from "next/server"
import { supabase, getUserByEmail, updateUser } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    if (!email || !code) return NextResponse.json({ error: "Email and code required" }, { status: 400 })

    // Find valid unused code
    const { data, error } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    // Mark code as used
    await supabase.from("otp_codes").update({ used: true }).eq("id", data.id)

    // Mark user email as verified
    const user = await getUserByEmail(email)
    if (user) await updateUser(user.id, { email_verified: true })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Verify OTP error:", err)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}