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

    case "setup_intent.succeeded": {
      const intent = event.data.object as Stripe.SetupIntent
      const customerId = intent.customer as string
      if (!customerId) break

      const { data: user } = await supabase
        .from("users")
        .select("id, role, email, stripe_subscription_id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (!user) {
        console.log(`No user found for customer ${customerId}, skipping`)
        break
      }

      // Check 1 — already have a subscription in our database
      if (user.stripe_subscription_id) {
        console.log(`Subscription already exists in DB for ${user.email}, skipping`)
        break
      }

      // Check 2 — check Stripe directly for any existing subscription
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 5,
      })

      const activeSub = existingSubs.data.find(
        (s) => s.status === "trialing" || s.status === "active"
      )

      if (activeSub) {
        console.log(`Active subscription already exists in Stripe for ${user.email}, saving and skipping`)
        await supabase
          .from("users")
          .update({
            stripe_subscription_id: activeSub.id,
            subscription_status: activeSub.status,
          })
          .eq("id", user.id)
        break
      }

      const priceId = user.role === "dispatcher"
        ? process.env.STRIPE_DISPATCHER_PRICE_ID!
        : process.env.STRIPE_CARRIER_PRICE_ID!

      const paymentMethodId = intent.payment_method as string

      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
      } catch (err: any) {
        // Already attached is fine, ignore that error
        if (!err?.message?.includes("already been attached")) throw err
      }

      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })

      // Check 3 — idempotency key tied to setup intent ID
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: 3,
        default_payment_method: paymentMethodId,
        metadata: { platform: "boxaloo", userId: user.id },
      }, {
        idempotencyKey: `sub_create_${intent.id}`,
      })

     try {
        await supabase
          .from("users")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
          })
          .eq("id", user.id)
      } catch (dbErr) {
        console.error("DB update failed but subscription created:", subscription.id, dbErr)
        // Still break — don't throw, we need to return 200 to Stripe
      }

      console.log(`Subscription created for ${user.email}: ${subscription.id} — status: ${subscription.status}`)
      break
    }

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
