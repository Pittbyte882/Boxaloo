import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import { sendPaymentReminderEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  // Secure this endpoint
  const secret = request.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  // Find users whose access expires in 1-4 days
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .in("role", ["dispatcher", "carrier"])
    .eq("active", true)
    .gte("access_expires_at", in1Day)
    .lte("access_expires_at", in4Days)

  if (error || !users) {
    console.error("Cron fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }

  let sent = 0
  for (const user of users) {
    const expiresAt = new Date(user.access_expires_at)
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    try {
      await sendPaymentReminderEmail({
        to: user.email,
        name: user.name,
        role: user.role,
        daysUntilExpiry,
        accessExpiresAt: user.access_expires_at,
      })
      sent++
    } catch (err) {
      console.error(`Reminder email failed for ${user.email}:`, err)
    }
  }

  return NextResponse.json({ success: true, remindersSent: sent })
}