import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    // Check user exists in your users table
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("name, email")
      .eq("email", email)
      .single()

    // Always return success to not reveal if email exists
    if (!user) return NextResponse.json({ success: true })

    // Delete any existing unused tokens for this email
    await supabaseAdmin
      .from("password_reset_tokens")
      .delete()
      .eq("email", email)
      .eq("used", false)

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex")
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Store token
    const { error } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert([{ email, token, expires_at }])
    if (error) throw error

    // Build reset URL
    const resetUrl = `https://loads.boxaloo.com/reset-password?token=${token}`

    // Send via Resend
    await sendPasswordResetEmail({
      to: email,
      name: user.name || "there",
      resetUrl,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 })
  }
}