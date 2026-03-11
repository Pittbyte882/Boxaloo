import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"

export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get("x-admin-secret")
  if (adminSecret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { email, customerId, subscriptionId } = await request.json()

    if (!email || !customerId || !subscriptionId) {
      return NextResponse.json({ error: "Missing required fields: email, customerId, subscriptionId" }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({
        active: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "trialing",
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("email", email)
      .select()
      .single()

    if (error || !user) {
      console.error("Activate user error:", error)
      return NextResponse.json(
        { error: error?.message || "User not found. Make sure the email matches exactly." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })
  } catch (err: any) {
    console.error("Activate user route error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}