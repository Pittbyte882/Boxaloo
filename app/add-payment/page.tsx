"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Loader2, CreditCard, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CARD_STYLE = {
  style: {
    base: {
      color: "#ffffff",
      fontFamily: "'Courier New', monospace",
      fontSize: "14px",
      "::placeholder": { color: "#555555" },
      backgroundColor: "transparent",
    },
    invalid: { color: "#ff4444" },
  },
}

function AddPaymentForm({ user }: { user: any }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError("")

    try {
      // Get or create setup intent
      const intentRes = await fetch("/api/stripe/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email, role: user.role }),
      })
      const intentData = await intentRes.json()
      if (!intentData.clientSecret) throw new Error("Failed to create setup intent")

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        intentData.clientSecret,
        { payment_method: { card: cardElement } }
      )

      if (stripeError) throw new Error(stripeError.message)

      // Create subscription now that card is saved
      const subRes = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          paymentMethodId: setupIntent?.payment_method,
          role: user.role,
        }),
      })

      if (!subRes.ok) {
        const subData = await subRes.json()
        throw new Error(subData.error || "Failed to create subscription")
      }

      // Save user to session
      sessionStorage.setItem("boxaloo_user", JSON.stringify(user))
      setSuccess(true)

      setTimeout(() => {
        router.push(user.role === "carrier" ? "/carrier" : "/dispatcher")
      }, 2000)

    } catch (err: any) {
      setError(err.message || "Failed to save card. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="size-12 text-primary mx-auto mb-4" />
        <p className="text-foreground font-bold text-lg">Payment method saved!</p>
        <p className="text-muted-foreground text-sm mt-2">Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className="p-4 rounded-lg border"
        style={{ borderColor: "rgba(57,255,20,0.2)", background: "rgba(57,255,20,0.03)" }}
      >
        <CardElement options={CARD_STYLE} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="size-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 h-12"
      >
        {loading
          ? <><Loader2 className="size-4 mr-2 animate-spin" /> Saving Card...</>
          : <><CreditCard className="size-4 mr-2" /> Save Card & Continue</>
        }
      </Button>
    </form>
  )
}

export default function AddPaymentPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState("")

  useEffect(() => {
    // Get user from sessionStorage — set during login when needs_payment is true
    const stored = sessionStorage.getItem("boxaloo_pending_user")
    if (!stored) {
      router.push("/")
      return
    }
    const parsedUser = JSON.parse(stored)
    setUser(parsedUser)

    // Pre-fetch setup intent
    fetch("/api/stripe/setup-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: parsedUser.id,
        email: parsedUser.email,
        role: parsedUser.role,
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.clientSecret) setClientSecret(d.clientSecret) })
  }, [router])

  if (!user || !clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
            BOX<span className="text-primary">ALOO</span>
          </span>
          <h1 className="text-xl font-bold text-foreground mt-4 mb-2">Add Payment Method</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hi {user.name}, a payment method is required to access your {user.role} dashboard.
            You won't be charged until your free trial ends.
          </p>
        </div>

        <div
          className="p-6 rounded-xl border"
          style={{ borderColor: "rgba(57,255,20,0.15)", background: "#0c0c0f" }}
        >
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
            <CreditCard className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Secure Card Entry
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Powered by Stripe</span>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <AddPaymentForm user={user} />
          </Elements>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Your card is encrypted and stored securely by Stripe. Boxaloo never stores card numbers.
        </p>
      </div>
    </div>
  )
}