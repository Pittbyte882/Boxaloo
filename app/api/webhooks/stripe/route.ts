import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/store"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
      console.log("Card saved successfully for customer:", intent.customer)
      break
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      // Mark user as inactive if payment fails
      if (invoice.customer) {
        await supabase
          .from("users")
          .update({ active: false })
          .eq("stripe_customer_id", invoice.customer as string)
      }
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      if (sub.customer) {
        await supabase
          .from("users")
          .update({ active: false })
          .eq("stripe_customer_id", sub.customer as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
