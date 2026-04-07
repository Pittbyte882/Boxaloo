"use client"

import { useState } from "react"
import { Shield, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PolicyAcceptanceModal({
  user,
  onAccepted,
}: {
  user: any
  onAccepted: () => void
}) {
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAccept = async () => {
    if (!checked) {
      setError("Please check the box to confirm you have read and agree to the policy.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/users/accept-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      if (!res.ok) throw new Error("Failed to record acceptance")
      
      // Update session storage
      const updatedUser = { ...user, policy_accepted_at: new Date().toISOString() }
      sessionStorage.setItem("boxaloo_user", JSON.stringify(updatedUser))
      
      onAccepted()
    } catch (err: any) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const role = user.role === "dispatcher" ? "Dispatcher" : "Carrier"
  const price = user.role === "dispatcher" ? "$55" : "$49"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
      <div className="max-w-lg w-full rounded-xl border p-6 lg:p-8"
        style={{ borderColor: "rgba(57,255,20,0.2)", background: "#0c0c0f" }}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b"
          style={{ borderColor: "rgba(57,255,20,0.1)" }}>
          <div className="size-10 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(57,255,20,0.1)" }}>
            <Shield className="size-5" style={{ color: "#39ff14" }} />
          </div>
          <div>
            <p className="font-bold text-foreground">Policy Update</p>
            <p className="text-xs text-muted-foreground">Action required before continuing</p>
          </div>
          <span className="ml-auto font-mono text-xl font-bold tracking-widest text-foreground">
            BOX<span style={{ color: "#39ff14" }}>ALOO</span>
          </span>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">
            Updated Billing & Cancellation Policy
          </h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Hi {user.name}, we have updated our billing terms. Please review the key changes below before continuing:
          </p>

          <div className="rounded-lg p-4 flex flex-col gap-3 mb-4"
            style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.15)" }}>
            <div className="flex items-start gap-2">
              <span style={{ color: "#39ff14" }} className="mt-0.5 shrink-0">→</span>
              <p className="text-sm text-foreground">
                <strong>No automatic billing.</strong> Boxaloo will never automatically charge your card.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: "#39ff14" }} className="mt-0.5 shrink-0">→</span>
              <p className="text-sm text-foreground">
                <strong>Manual payment required.</strong> You must log in and pay <strong>{price}</strong> every 30 days to maintain access as a {role}.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: "#39ff14" }} className="mt-0.5 shrink-0">→</span>
              <p className="text-sm text-foreground">
                <strong>Reminders sent.</strong> You will receive an email reminder before your access expires.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: "#39ff14" }} className="mt-0.5 shrink-0">→</span>
              <p className="text-sm text-foreground">
                <strong>No refunds.</strong> All payments are final and non-refundable.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: "#39ff14" }} className="mt-0.5 shrink-0">→</span>
              <p className="text-sm text-foreground">
                <strong>No chargebacks.</strong> You agree to contact billing@boxaloo.com before disputing any charge with your bank.
              </p>
            </div>
          </div>

          <a
            href="/cancellation-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm hover:underline"
            style={{ color: "#39ff14" }}
          >
            Read full Cancellation & Refund Policy
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-4 p-3 rounded-lg border transition-colors"
          style={{
            borderColor: checked ? "rgba(57,255,20,0.3)" : "rgba(255,255,255,0.08)",
            background: checked ? "rgba(57,255,20,0.04)" : "transparent"
          }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => { setChecked(e.target.checked); setError("") }}
            className="mt-0.5 shrink-0 accent-green-400"
          />
          <span className="text-sm text-foreground leading-relaxed">
            I confirm that I have read, understood, and agree to the updated{" "}
            <a href="/cancellation-policy" target="_blank" rel="noopener noreferrer"
              className="underline" style={{ color: "#39ff14" }}>
              Cancellation & Refund Policy
            </a>
            {" "}and understand that I must manually pay {price} every 30 days to maintain access to Boxaloo.
          </span>
        </label>

        {error && (
          <p className="text-sm text-destructive mb-4 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          onClick={handleAccept}
          disabled={loading}
          className="w-full font-bold uppercase tracking-wider h-11"
          style={{ background: "#39ff14", color: "#070709" }}
        >
          {loading ? "Recording..." : "I Agree — Continue to Dashboard"}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Your acceptance is recorded with a timestamp and IP address for your protection.
        </p>
      </div>
    </div>
  )
}