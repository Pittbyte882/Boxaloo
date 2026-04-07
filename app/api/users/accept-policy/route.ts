import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })

    // Get IP address
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown"

    const { error } = await supabase
      .from("users")
      .update({
        policy_accepted_at: new Date().toISOString(),
        policy_accepted_ip: ip,
      })
      .eq("id", userId)

    if (error) {
      console.error("Policy acceptance error:", error)
      return NextResponse.json({ error: "Failed to record acceptance" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Accept policy error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}