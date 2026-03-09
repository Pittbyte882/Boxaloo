import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const { data: user } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("email", email)
      .single()

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ hasPaymentMethod: false })
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: "card",
    })

    return NextResponse.json({
      hasPaymentMethod: paymentMethods.data.length > 0,
    })
  } catch (err) {
    console.error("Verify payment method error:", err)
    return NextResponse.json({ hasPaymentMethod: false })
  }
}