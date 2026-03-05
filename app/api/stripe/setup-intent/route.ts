import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name, company, role } = await request.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    // Check if user already has a Stripe customer
    const { data: user } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("email", email)
      .single()

    let customerId = user?.stripe_customer_id

    if (customerId) {
      // Verify customer still exists in Stripe
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        customerId = null // customer was deleted, create new one
      }
    }

    // Only create customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: `${name} — ${company}`,
        metadata: { platform: "boxaloo", role },
      })
      customerId = customer.id

      // Save IMMEDIATELY before creating setup intent
      // so webhook can find user when it fires
      if (user) {
        await supabase
          .from("users")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id)
      }
    }

    // NOW create setup intent — customer already saved in Supabase
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        userId: user?.id || "",
        role: role || "",
      },
    })

    if (user) {
      await supabase
        .from("users")
        .update({ stripe_setup_intent_id: setupIntent.id })
        .eq("id", user.id)
    }

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    })
  } catch (err) {
    console.error("Setup intent error:", err)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}