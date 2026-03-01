import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 })
    }

    // Find token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 })
    }

    // Check expiry
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 })
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 10)

    // Update user's password
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password_hash })
      .eq("email", resetToken.email)

    if (updateError) throw updateError

    // Mark token as used
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", token)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Reset password error:", err)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}