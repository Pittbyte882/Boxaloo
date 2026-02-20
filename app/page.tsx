"use client"

import { useState } from "react"
import {
  ArrowRight, Shield, Zap, DollarSign, Package, CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { BoxalooWordmark } from "@/components/boxaloo-wordmark"

type AuthMode = "login" | "signup"

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

export default function HomePage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [role, setRole] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [company, setCompany] = useState("")
  const [brokerMc, setBrokerMc] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email || !password) { setError("Email and password are required."); return }
    if (mode === "signup" && !role) { setError("Please select your role."); return }
    if (mode === "signup" && !name) { setError("Please enter your name."); return }

    setLoading(true)
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup"
      const body = mode === "login"
        ? { email, password }
        : { email, password, name, company, role, brokerMc }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── HEADER ── */}
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
                <div className="flex gap-2 mb-6">
                  <button type="button" onClick={() => { setMode("login"); setError("") }}
                    className={cn("flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors",
                      mode === "login" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>
                    Log In
                  </button>
                  <button type="button" onClick={() => { setMode("signup"); setError("") }}
                    className={cn("flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors",
                      mode === "signup" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>
                    Sign Up
                  </button>
                </div>

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
                        ? "30-day free trial. Credit card required at signup. Charged on day 30."
                        : "3-day free trial. Credit card required at signup. Charged on day 4."}
                    </p>
                  )}
                  {error && (
                    <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
                  )}
                  <Button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2">
                    {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
                    {!loading && <ArrowRight className="size-4 ml-2" />}
                  </Button>
                </form>
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
              { role: "Broker", trial: "30-day free trial", price: "$99/mo", features: ["Post unlimited loads", "In-app messaging", "Load management dashboard", "Booking request management"] },
              { role: "Dispatcher", trial: "3-day free trial", price: "$49/mo", features: ["Browse full load board", "Manage driver roster", "Book on behalf of drivers", "Driver document management"] },
              { role: "Carrier", trial: "3-day free trial", price: "$29/mo", features: ["Full load board access", "Direct load booking", "Message brokers directly", "Track booked loads"] },
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

      {/* ── FOOTER ── */}
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