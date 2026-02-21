import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import { sendDriverInviteEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, dispatcherId, dispatcherName, dispatcherCompany } = await request.json()

    if (!email || !dispatcherId) {
      return NextResponse.json({ error: "Email and dispatcher ID required" }, { status: 400 })
    }

    // Generate unique token
    const token = `${dispatcherId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    // Store invite token in Supabase
    await supabase.from("driver_invites").insert([{
      token,
      dispatcher_id: dispatcherId,
      email,
      created_at: new Date().toISOString(),
      used: false,
    }])

    // Send email
    await sendDriverInviteEmail({
      to: email,
      driverName: email.split("@")[0], // fallback name until they sign up
      dispatcherName: dispatcherName || "Your Dispatcher",
      dispatcherCompany: dispatcherCompany || "Boxaloo",
      token,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Invite error:", err)
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 })
  }
}