"use client"

import { useState } from "react"
import {
  ArrowRight, Shield, Zap, DollarSign, Package, CheckCircle, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { BoxalooWordmark } from "@/components/boxaloo-wordmark"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type AuthMode = "login" | "signup"
type SignupStep = "form" | "card" | "otp"

const features = [
  { icon: <Package className="size-5" />, title: "Live Load Board", desc: "Real-time freight matching across the nation" },
  { icon: <Zap className="size-5" />, title: "Instant Booking", desc: "Request and book loads in seconds" },
  { icon: <Shield className="size-5" />, title: "Verified Brokers", desc: "Every load posted by verified MC# brokers" },
  { icon: <DollarSign className="size-5" />, title: "Transparent Pay", desc: "See rates upfront, negotiate directly" },
]

const stats = [
  { value: "12,400+", label: "Active Loads" },
  { value: "3,200+", label: "Carriers" },
  { value: "850+", label: "Brokers" },
  { value: "$2.4M", label: "Weekly Volume" },
]

// ── Card collection step (inside Stripe Elements) ──
function CardStep({
  email, name, company, role, onSuccess, onBack,
}: {
  email: string
  name: string
  company: string
  role: string
  onSuccess: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const price = role === "dispatcher" ? "$49/mo" : "$29/mo"
  const trialDays = 3

  async function handleCardSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError("Please agree to the billing terms to continue."); return }
    if (!stripe || !elements) return
    setLoading(true)
    setError("")

    try {
      // Get setup intent from server
      const res = await fetch("/api/stripe/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company }),
      })
      const { clientSecret, error: serverError } = await res.json()
      if (serverError) { setError(serverError); return }

      // Confirm card setup
      const { error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name, email },
        },
      })

      if (stripeError) {
        setError(stripeError.message || "Card setup failed.")
        return
      }

      onSuccess()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCardSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-bold text-foreground mb-1">Payment Method</p>
        <p className="text-xs text-muted-foreground mb-4">
          Your card will not be charged during your {trialDays}-day free trial.
          After the trial, you'll be billed {price} every 30 days. Cancel anytime.
        </p>
      </div>

      {/* Stripe card element */}
      <div className="rounded-lg border border-border bg-input p-3">
        <CardElement options={{
          style: {
            base: {
              fontSize: "14px",
              color: "#ffffff",
              fontFamily: "monospace",
              "::placeholder": { color: "#555" },
            },
            invalid: { color: "#ff4444" },
          },
        }} />
      </div>

      {/* Agreement checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div
          onClick={() => setAgreed(!agreed)}
          className={cn(
            "mt-0.5 size-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer",
            agreed ? "bg-primary border-primary" : "border-border bg-input"
          )}
        >
          {agreed && <CheckCircle className="size-3 text-primary-foreground" />}
        </div>
        <span className="text-[11px] text-muted-foreground leading-relaxed">
          I understand my card will <strong className="text-foreground">not be charged</strong> until
          my {trialDays}-day free trial ends. After the trial, I authorize Boxaloo to charge
          <strong className="text-foreground"> {price}</strong> every 30 days until I cancel.
          I can cancel anytime from my account settings.
        </span>
      </label>

      {error && <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          type="submit"
          disabled={loading || !agreed}
          className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90"
        >
          {loading ? "Saving card..." : "Continue"}
          {!loading && <ArrowRight className="size-4 ml-2" />}
        </Button>
      </div>
    </form>
  )
}

// ── OTP verification step ──
function OtpStep({
  email, name, pendingUser, onSuccess,
}: {
  email: string
  name: string
  pendingUser: any
  onSuccess: (user: any) => void
}) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [resent, setResent] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError("Please enter the 6-digit code."); return }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Invalid code."); return }
      onSuccess(pendingUser)
    } catch {
      setError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setResent(false)
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <div className="text-center py-2">
        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="size-6 text-primary" />
        </div>
        <p className="text-sm font-bold text-foreground mb-1">Check your email</p>
        <p className="text-xs text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Verification Code</Label>
        <Input
          className="bg-input border-border text-foreground font-mono text-center text-2xl tracking-[0.5em] h-14"
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      {error && <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
      {resent && <p className="text-[12px] text-green-400 bg-green-400/10 rounded-lg px-3 py-2">Code resent! Check your inbox.</p>}

      <Button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90"
      >
        {loading ? "Verifying..." : "Verify Email"}
        {!loading && <ArrowRight className="size-4 ml-2" />}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <RefreshCw className={cn("size-3", resending && "animate-spin")} />
        {resending ? "Sending..." : "Resend code"}
      </button>
    </form>
  )
}

// ── Main page ──
export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [step, setStep] = useState<SignupStep>("form")
  const [role, setRole] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [company, setCompany] = useState("")
  const [brokerMc, setBrokerMc] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingUser, setPendingUser] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email || !password) { setError("Email and password are required."); return }
    if (mode === "signup" && !role) { setError("Please select your role."); return }
    if (mode === "signup" && !name) { setError("Please enter your name."); return }

    setLoading(true)
    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (data.suspended) { window.location.href = "/suspended"; return }
          setError(data.error || "Something went wrong.")
          return
        }
        sessionStorage.setItem("boxaloo_user", JSON.stringify(data.user))
        const userRole = data.user.role
        if (userRole === "admin") window.location.href = "/admin"
        else if (userRole === "broker") window.location.href = "/broker"
        else if (userRole === "dispatcher") window.location.href = "/dispatcher"
        else if (userRole === "carrier") window.location.href = "/carrier"
        else window.location.href = "/loadboard"
        return
      }

      // Signup — create account first
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, company, role, brokerMc }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Something went wrong."); return }

      setPendingUser(data.user)

      // Carrier/dispatcher go to card step first
      if (role === "carrier" || role === "dispatcher") {
        setStep("card")
      } else {
        // Broker goes straight to OTP
        await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        })
        setStep("otp")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCardSuccess() {
    // Card saved — now send OTP
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    })
    setStep("otp")
  }

  function handleVerified(user: any) {
    sessionStorage.setItem("boxaloo_user", JSON.stringify(user))
    const userRole = user.role
    if (userRole === "admin") window.location.href = "/admin"
    else if (userRole === "broker") window.location.href = "/broker"
    else if (userRole === "dispatcher") window.location.href = "/dispatcher"
    else if (userRole === "carrier") window.location.href = "/carrier"
    else window.location.href = "/loadboard"
  }

  const needsCard = (role === "carrier" || role === "dispatcher") && mode === "signup"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header
        className="flex items-center justify-between px-6 py-4 border-b border-border"
        style={{ borderColor: "rgba(57,255,20,0.08)" }}
      >
        <BoxalooWordmark size="md" />
        <nav className="hidden md:flex items-center gap-6">
          <a href="/loadboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Load Board</a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 mb-6">
                #1 Load Board for Box Trucks
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] text-balance">
                Find Loads.<br />
                <span className="text-primary">Move Freight.</span><br />
                Get Paid.
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg mt-6 max-w-md leading-relaxed">
                The fastest load board built for box trucks, cargo vans, sprinter vans, and hotshots. Real-time loads. Verified brokers. Zero friction.
              </p>
              <div className="grid grid-cols-4 gap-4 mt-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-lg lg:text-xl font-bold font-mono text-primary">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="rounded-xl border border-border bg-card p-6 lg:p-8 shadow-2xl shadow-primary/5">

                {/* Step indicator for signup */}
                {mode === "signup" && step !== "form" && (
                  <div className="flex items-center gap-2 mb-6">
                    {(needsCard ? ["form", "card", "otp"] : ["form", "otp"]).map((s, i) => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={cn(
                          "size-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                          step === s ? "bg-primary text-primary-foreground"
                            : ["form", "card", "otp"].indexOf(step) > i ? "bg-primary/30 text-primary"
                            : "bg-accent text-muted-foreground"
                        )}>
                          {i + 1}
                        </div>
                        {i < (needsCard ? 2 : 1) && <div className="h-px w-6 bg-border" />}
                      </div>
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">
                      {step === "card" ? "Payment Method" : "Verify Email"}
                    </span>
                  </div>
                )}

                {/* Tab switcher — only show on form step */}
                {step === "form" && (
                  <div className="flex gap-2 mb-6">
                    <button type="button" onClick={() => { setMode("login"); setError(""); setStep("form") }}
                      className={cn("flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors",
                        mode === "login" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>
                      Log In
                    </button>
                    <button type="button" onClick={() => { setMode("signup"); setError(""); setStep("form") }}
                      className={cn("flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors",
                        mode === "signup" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>
                      Sign Up
                    </button>
                  </div>
                )}

                {/* STEP: Form */}
                {step === "form" && (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {mode === "signup" && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5">Full Name</Label>
                          <Input className="bg-input border-border text-foreground" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5">Company Name</Label>
                          <Input className="bg-input border-border text-foreground" placeholder="Your company" value={company} onChange={(e) => setCompany(e.target.value)} />
                        </div>
                      </>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Email</Label>
                      <Input className="bg-input border-border text-foreground" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Password</Label>
                      <Input className="bg-input border-border text-foreground" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {mode === "signup" && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5">I am a...</Label>
                        <Select value={role} onValueChange={setRole}>
                          <SelectTrigger className="bg-input border-border text-foreground">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="broker">Broker</SelectItem>
                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                            <SelectItem value="carrier">Carrier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {mode === "signup" && role === "broker" && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5">Broker MC# (optional)</Label>
                        <Input className="bg-input border-border text-foreground font-mono" placeholder="MC-123456" value={brokerMc} onChange={(e) => setBrokerMc(e.target.value)} />
                      </div>
                    )}
                    {mode === "signup" && role && (
                      <p className="text-[11px] text-muted-foreground bg-accent rounded-lg p-3">
                        {role === "broker"
                          ? "✓  free · No credit card required"
                          : `✓ ${role === "dispatcher" ? "3" : "3"}-day free trial · Card required · Not charged until trial ends`}
                      </p>
                    )}
                    {error && <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
                    <Button type="submit" disabled={loading}
                      className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2">
                      {loading ? "Please wait..." : mode === "login" ? "Log In" : "Continue"}
                      {!loading && <ArrowRight className="size-4 ml-2" />}
                    </Button>
                  </form>
                )}

                {/* STEP: Card */}
                {step === "card" && (
                  <Elements stripe={stripePromise}>
                    <CardStep
                      email={email}
                      name={name}
                      company={company}
                      role={role}
                      onSuccess={handleCardSuccess}
                      onBack={() => setStep("form")}
                    />
                  </Elements>
                )}

                {/* STEP: OTP */}
                {step === "otp" && (
                  <OtpStep
                    email={email}
                    name={name}
                    pendingUser={pendingUser}
                    onSuccess={handleVerified}
                  />
                )}

              </div>
            </div>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight text-center mb-10">
            Built for the Way You Haul
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">{f.icon}</div>
                <h3 className="font-bold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight text-center mb-10">
            Simple Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { role: "Broker", trial: "Free", price: "Free", features: ["Post unlimited loads", "In-app messaging", "Load management dashboard", "Booking request management"] },
                { role: "Dispatcher", trial: "3-day free trial", price: "$49/mo", features: ["Browse full load board", "Manage driver roster", "Book on behalf of drivers", "Driver document management"] },
                { role: "Carrier", trial: "3-day free trial", price: "$49/mo", features: ["Full load board access", "Direct load booking", "Message brokers directly", "Track booked loads"] },
              ].map((plan) => (
              <div key={plan.role} className={cn("rounded-xl border bg-card p-6", plan.role === "Broker" ? "border-primary" : "border-border")}>
                {plan.role === "Broker" && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-[10px] font-bold uppercase tracking-wider mb-3">Most Popular</Badge>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.role}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.trial}</p>
                <p className="text-3xl font-bold font-mono text-primary mb-6">{plan.price}</p>
                <ul className="flex flex-col gap-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="size-3.5 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="border-t px-6 py-6"
        style={{ borderColor: "rgba(57,255,20,0.08)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <BoxalooWordmark size="sm" />
          <p className="text-xs text-muted-foreground">© 2026 Boxaloo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", className)} {...props} />
}