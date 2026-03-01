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
    console.log("1. Got email:", email)
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const { data: users, error: lookupError } = await supabaseAdmin.auth.admin.listUsers()
    console.log("2. List users error:", lookupError)
    console.log("3. Total users found:", users?.users?.length)

    const user = users.users.find((u) => u.email === email)
    console.log("4. Found user:", !!user)

    if (!user) {
      console.log("5. User not found — returning success silently")
      return NextResponse.json({ success: true })
    }

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("email", email)
      .single()
    console.log("6. Profile:", profile)

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "https://loads.boxaloo.com/reset-password" },
    })
    console.log("7. Generate link error:", error)
    console.log("8. Generated link:", data?.properties?.action_link)

    if (error) throw error

    await sendPasswordResetEmail({
      to: email,
      name: profile?.name || "there",
      resetUrl: data.properties.action_link,
    })
    console.log("9. Email sent via Resend")

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 })
  }
}