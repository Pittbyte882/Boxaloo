import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name, company, role } = await request.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: `${name} — ${company}`,
      metadata: { platform: "boxaloo", role },
    })

    // Create setup intent — saves card without charging
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      usage: "off_session",
    })

    // Save customer ID to user record
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (user) {
      await supabase
        .from("users")
        .update({
          stripe_customer_id: customer.id,
          stripe_setup_intent_id: setupIntent.id,
        })
        .eq("id", user.id)
    }

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    })
  } catch (err) {
    console.error("Setup intent error:", err)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}