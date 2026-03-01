import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendPasswordResetEmail } from "@/lib/email"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    // Check user exists
    const { data: users, error: lookupError } = await supabaseAdmin.auth.admin.listUsers()
    if (lookupError) throw lookupError

    const user = users.users.find((u) => u.email === email)
    if (!user) {
      // Return success anyway to not reveal if email exists
      return NextResponse.json({ success: true })
    }

    // Get their name from your users table
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("email", email)
      .single()

    const name = profile?.name || "there"

    // Generate reset link via Supabase admin
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://loads.boxaloo.com/reset-password",
      },
    })

    if (error) throw error

    // Send via Resend with your branded template
    await sendPasswordResetEmail({
      to: email,
      name,
      resetUrl: data.properties.action_link,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 })
  }
}