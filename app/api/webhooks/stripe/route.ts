import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_TO_ROLE: Record<string, string> = {
  [process.env.STRIPE_CARRIER_PRICE_ID!]: "carrier",
  [process.env.STRIPE_DISPATCHER_PRICE_ID!]: "dispatcher",
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {

    // Card saved — now create subscription with 3-day trial
    case "setup_intent.succeeded": {
      const intent = event.data.object as Stripe.SetupIntent
      const customerId = intent.customer as string
      if (!customerId) break

      // Get user to find their role
      const { data: user } = await supabase
        .from("users")
        .select("id, role, email")
        .eq("stripe_customer_id", customerId)
        .single()

      if (!user) break

      const priceId = user.role === "dispatcher"
        ? process.env.STRIPE_DISPATCHER_PRICE_ID!
        : process.env.STRIPE_CARRIER_PRICE_ID!

      // Attach payment method to customer
      const paymentMethodId = intent.payment_method as string
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })

      // Create subscription with 3-day trial
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: 3,
        default_payment_method: paymentMethodId,
        metadata: { platform: "boxaloo", userId: user.id },
      })

      // Save subscription to user
      await supabase
        .from("users")
        .update({
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status, // "trialing"
        })
        .eq("id", user.id)

      console.log(`Subscription created for ${user.email}: ${subscription.id} — status: ${subscription.status}`)
      break
    }

    // Trial ended and payment succeeded — activate user
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      if (!invoice.customer) break

      await supabase
        .from("users")
        .update({
          active: true,
          subscription_status: "active",
        })
        .eq("stripe_customer_id", invoice.customer as string)

      console.log(`Payment succeeded for customer: ${invoice.customer}`)
      break
    }

    // Payment failed — suspend user
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      if (!invoice.customer) break

      await supabase
        .from("users")
        .update({
          active: false,
          subscription_status: "past_due",
        })
        .eq("stripe_customer_id", invoice.customer as string)

      console.log(`Payment failed for customer: ${invoice.customer}`)
      break
    }

    // Subscription canceled — suspend user
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      if (!sub.customer) break

      await supabase
        .from("users")
        .update({
          active: false,
          subscription_status: "canceled",
        })
        .eq("stripe_customer_id", sub.customer as string)

      console.log(`Subscription canceled for customer: ${sub.customer}`)
      break
    }

    // Subscription updated (trial ended, plan changed, etc.)
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      if (!sub.customer) break

      await supabase
        .from("users")
        .update({
          subscription_status: sub.status,
          active: sub.status === "active" || sub.status === "trialing",
        })
        .eq("stripe_customer_id", sub.customer as string)

      console.log(`Subscription updated for customer: ${sub.customer} — status: ${sub.status}`)
      break
    }
  }

  return NextResponse.json({ received: true })
}
