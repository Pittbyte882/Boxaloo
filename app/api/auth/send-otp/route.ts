import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import { sendOtpEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Delete any existing unused codes for this email
    await supabase.from("otp_codes").delete().eq("email", email).eq("used", false)

    // Insert new code
    const { error } = await supabase.from("otp_codes").insert([{ email, code, expires_at }])
    if (error) throw error

    // Send email
    await sendOtpEmail({ to: email, name: name || "there", code })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Send OTP error:", err)
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 })
  }
}