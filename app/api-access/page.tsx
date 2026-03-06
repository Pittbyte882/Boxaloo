"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Key, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const tmsSoftwareOptions = [
  "McLeod Software", "Turvo", "AscendTMS", "Axele TMS", "Rose Rocket",
  "Tai TMS", "Aljex", "CargoWise", "Custom / In-house", "None", "Other",
]

const volumeOptions = [
  "Under 10 loads/month",
  "10–50 loads/month",
  "50–200 loads/month",
  "200–500 loads/month",
  "500+ loads/month",
]

const heardOptions = [
  "Google Search", "LinkedIn", "Referral from another broker",
  "Industry conference", "Social media", "Other",
]

export default function ApiAccessPage() {
  const router = useRouter()
  const [step, setStep] = useState<"form" | "success">("form")
  const [loading, setLoading] = useState(false)
  const [fmcsaLoading, setFmcsaLoading] = useState(false)
  const [fmcsaVerified, setFmcsaVerified] = useState(false)
  const [fmcsaError, setFmcsaError] = useState("")
  const [fmcsaName, setFmcsaName] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    company_name: "",
    legal_name: "",
    mc_number: "",
    website: "",
    monthly_load_volume: "",
    tms_software: "",
    reason_for_access: "",
    has_dev_team: false,
    heard_about_us: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  })

  const set = (field: string, value: any) =>
    setForm((p) => ({ ...p, [field]: value }))

  const verifyFmcsa = async () => {
    if (!form.mc_number.trim()) return
    setFmcsaLoading(true)
    setFmcsaError("")
    setFmcsaVerified(false)
    try {
      const res = await fetch(
        `/api/fmcsa/verify?mc=${encodeURIComponent(form.mc_number.replace(/\D/g, ""))}`,
        { headers: { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" } }
      )
      const data = await res.json()
      if (data.authorized) {
        setFmcsaVerified(true)
        setFmcsaName(data.legalName || "")
        if (data.legalName && !form.legal_name) {
          set("legal_name", data.legalName)
        }
        if (data.legalName && !form.company_name) {
          set("company_name", data.legalName)
        }
      } else {
        setFmcsaError(data.reason || "MC number could not be verified with FMCSA.")
      }
    } catch {
      setFmcsaError("Verification failed. Please try again.")
    } finally {
      setFmcsaLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!fmcsaVerified) {
      setError("Please verify your MC number before submitting.")
      return
    }
    if (!form.monthly_load_volume) {
      setError("Please select your monthly load volume.")
      return
    }
    if (!form.tms_software) {
      setError("Please select your TMS software.")
      return
    }
    if (form.reason_for_access.length < 30) {
      setError("Please provide more detail on why you need API access (at least 30 characters).")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/api-keys/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fmcsa_legal_name: fmcsaName,
          fmcsa_authorized: fmcsaVerified,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Submission failed")
      setStep("success")
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Application Submitted</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Thank you for applying for Boxaloo API access. Our team will review your application
            and get back to you within 1–2 business days.
          </p>
          <div className="p-4 rounded-lg border border-border bg-card text-left mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">What happens next</p>
            {[
              "We verify your MC# and company details",
              "Our team reviews your application",
              "You receive your API key via email",
              "Start integrating with our API",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => router.push("/")}
            className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90">
            Back to Boxaloo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-mono text-xl font-bold tracking-widest text-foreground">
            BOX<span className="text-primary">ALOO</span>
          </span>
          <Badge className="bg-primary/10 text-primary border-0 font-mono text-xs">
            <Key className="size-3 mr-1" /> API Access
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Apply for API Access</h1>
          <p className="text-muted-foreground leading-relaxed">
            The Boxaloo API allows brokers to post, update, and delete loads directly from their TMS.
            Fill out the form below and our team will review your application within 1–2 business days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Section 1: Company Info ── */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
              Company Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)}
                  placeholder="Acme Freight Brokers" required
                  className="bg-background border-border text-foreground h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Legal Business Name <span className="text-destructive">*</span>
                </Label>
                <Input value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)}
                  placeholder="Acme Freight Brokers LLC" required
                  className="bg-background border-border text-foreground h-10" />
              </div>
            </div>

            {/* MC Number with FMCSA verify */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                MC Number <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={form.mc_number}
                  onChange={(e) => {
                    set("mc_number", e.target.value)
                    setFmcsaVerified(false)
                    setFmcsaError("")
                    setFmcsaName("")
                  }}
                  placeholder="123456"
                  className="bg-background border-border text-foreground h-10 flex-1"
                />
                <Button type="button" onClick={verifyFmcsa} disabled={fmcsaLoading || !form.mc_number}
                  variant="outline"
                  className={`h-10 text-xs font-bold uppercase tracking-wider border-border shrink-0 ${fmcsaVerified ? "border-primary text-primary" : ""}`}>
                  {fmcsaLoading ? <Loader2 className="size-3.5 animate-spin" /> : fmcsaVerified ? "✓ Verified" : "Verify MC"}
                </Button>
              </div>
              {fmcsaVerified && fmcsaName && (
                <p className="text-xs text-primary font-semibold">✓ FMCSA: {fmcsaName}</p>
              )}
              {fmcsaError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" /> {fmcsaError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Company Website
              </Label>
              <Input value={form.website} onChange={(e) => set("website", e.target.value)}
                placeholder="https://yourcompany.com" type="url"
                className="bg-background border-border text-foreground h-10" />
            </div>
          </div>

          {/* ── Section 2: Vetting Questions ── */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
              Usage & Qualification
            </h2>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                How many loads do you post per month? <span className="text-destructive">*</span>
              </Label>
              <Select value={form.monthly_load_volume} onValueChange={(v) => set("monthly_load_volume", v)}>
                <SelectTrigger className="bg-background border-border text-foreground h-10">
                  <SelectValue placeholder="Select volume" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {volumeOptions.map((o) => (
                    <SelectItem key={o} value={o} className="text-foreground">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                What TMS software do you currently use? <span className="text-destructive">*</span>
              </Label>
              <Select value={form.tms_software} onValueChange={(v) => set("tms_software", v)}>
                <SelectTrigger className="bg-background border-border text-foreground h-10">
                  <SelectValue placeholder="Select TMS" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {tmsSoftwareOptions.map((o) => (
                    <SelectItem key={o} value={o} className="text-foreground">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Why do you need API access? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={form.reason_for_access}
                onChange={(e) => set("reason_for_access", e.target.value)}
                placeholder="Describe how you plan to use the Boxaloo API and what problem it solves for your business..."
                rows={4}
                className="bg-background border-border text-foreground resize-none"
              />
              <p className="text-xs text-muted-foreground">{form.reason_for_access.length} / 30 min characters</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border">
              <input
                type="checkbox"
                id="has_dev_team"
                checked={form.has_dev_team}
                onChange={(e) => set("has_dev_team", e.target.checked)}
                className="size-4 accent-primary"
              />
              <Label htmlFor="has_dev_team" className="text-sm text-foreground cursor-pointer">
                We have a developer or technical team capable of integrating the API
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                How did you hear about Boxaloo?
              </Label>
              <Select value={form.heard_about_us} onValueChange={(v) => set("heard_about_us", v)}>
                <SelectTrigger className="bg-background border-border text-foreground h-10">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {heardOptions.map((o) => (
                    <SelectItem key={o} value={o} className="text-foreground">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Section 3: Contact Info ── */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)}
                  placeholder="Jane Smith" required
                  className="bg-background border-border text-foreground h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)}
                  placeholder="jane@yourcompany.com" type="email" required
                  className="bg-background border-border text-foreground h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Phone Number
              </Label>
              <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)}
                placeholder="(555) 000-0000" type="tel"
                className="bg-background border-border text-foreground h-10" />
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            By submitting this application you agree to Boxaloo's API Terms of Service.
            API keys are non-transferable and may be revoked at any time for misuse or violation of terms.
            Rate limits apply (100 requests/hour). Boxaloo reserves the right to approve or deny any application.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="size-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} size="lg"
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 h-12">
            {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application →"}
          </Button>
        </form>
      </div>
    </div>
  )
}