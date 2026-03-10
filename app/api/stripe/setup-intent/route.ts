import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, name, company, role, userId } = await request.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    // Check if user already has a Stripe customer
    const { data: user } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("email", email)
      .maybeSingle()

    let customerId = user?.stripe_customer_id

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        customerId = null
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: name ? `${name} — ${company || ""}` : email,
        metadata: { platform: "boxaloo", role: role || "" },
      })
      customerId = customer.id

      // Save customer ID if user already exists
      if (user) {
        await supabase
          .from("users")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id)
      }
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        userId: user?.id || userId || "",
        role: role || "",
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    })
  } catch (err) {
    console.error("Setup intent error:", err)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}