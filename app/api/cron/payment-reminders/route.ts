import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import { sendPaymentReminderEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  // Verify this is called from Supabase cron via a secret
  const secret = request.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find carriers and dispatchers whose trial ends in exactly 5 days
    const fiveDaysFromNow = new Date()
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)
    const dateStr = fiveDaysFromNow.toISOString().split("T")[0] // YYYY-MM-DD

    const { data: users, error } = await supabase
      .from("users")
      .select("email, name, role, trial_ends_at")
      .in("role", ["carrier", "dispatcher"])
      .eq("active", true)
      .gte("trial_ends_at", `${dateStr}T00:00:00.000Z`)
      .lte("trial_ends_at", `${dateStr}T23:59:59.999Z`)

    if (error) throw error

    let sent = 0
    for (const user of users ?? []) {
      try {
        await sendPaymentReminderEmail({
          to: user.email,
          name: user.name,
          role: user.role,
          trialEndsAt: user.trial_ends_at,
        })
        sent++
      } catch (e) {
        console.error(`Reminder failed for ${user.email}:`, e)
      }
    }

    return NextResponse.json({ success: true, sent })
  } catch (err) {
    console.error("Payment reminder cron error:", err)
    return NextResponse.json({ error: "Cron failed" }, { status: 500 })
  }
}
