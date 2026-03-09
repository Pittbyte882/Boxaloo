import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/store"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentMethodId, role } = await request.json()

    if (!userId || !paymentMethodId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the correct price ID based on role
    const priceId = role === "dispatcher"
      ? process.env.STRIPE_DISPATCHER_PRICE_ID
      : process.env.STRIPE_CARRIER_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 })
    }

    let customerId = user.stripe_customer_id

    // Create Stripe customer if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id, role: user.role },
      })
      customerId = customer.id

      // Save customer ID immediately
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Check if subscription already exists
    if (user.stripe_subscription_id) {
      const existing = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
      if (existing && existing.status !== "canceled") {
        // Just update the payment method on existing subscription
        await stripe.subscriptions.update(user.stripe_subscription_id, {
          default_payment_method: paymentMethodId,
        })
        await supabase
          .from("users")
          .update({
            active: true,
            subscription_status: existing.status,
          })
          .eq("id", userId)

        return NextResponse.json({ success: true, subscription_id: existing.id })
      }
    }

    // Create new subscription with 7 day trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 7,
      default_payment_method: paymentMethodId,
      metadata: { userId, role },
    })

    // Save subscription to Supabase
    await supabase
      .from("users")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        active: true,
        trial_ends_at: new Date(subscription.trial_end! * 1000).toISOString(),
      })
      .eq("id", userId)

    return NextResponse.json({ success: true, subscription_id: subscription.id })

  } catch (err: any) {
    console.error("Create subscription error:", err)
    return NextResponse.json({ error: err.message || "Failed to create subscription" }, { status: 500 })
  }
}