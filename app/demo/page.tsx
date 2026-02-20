"use client"

import { useState } from "react"
import { BoxalooWordmark } from "@/components/boxaloo-wordmark"
import { cn } from "@/lib/utils"
import { ArrowRight, CheckCircle } from "lucide-react"

const tabs = [
  {
    id: "broker",
    label: "For Brokers",
    tagline: "Post loads, manage requests, send rate cons",
    color: "#39ff14",
    videoId: "YOUR_BROKER_YOUTUBE_ID", // replace with your YouTube video ID
    features: [
      "Post a load in under 60 seconds",
      "Review and accept carrier/dispatcher requests",
      "Send Rate Confirmation directly in the app",
      "Cancel or update loads anytime",
      "Message carriers and dispatchers directly",
      "Track all your active loads in one dashboard",
    ],
    cta: "Start Posting Loads Free",
  },
  {
    id: "carrier",
    label: "For Carriers",
    tagline: "Find loads, book instantly, get paid",
    color: "#39ff14",
    videoId: "YOUR_CARRIER_YOUTUBE_ID", // replace with your YouTube video ID
    features: [
      "Browse the full live load board",
      "Filter by equipment type and location",
      "Request loads with one click",
      "Message brokers directly",
      "View Rate Cons and load details",
      "Track all your booked loads",
    ],
    cta: "Start Finding Loads",
  },
  {
    id: "dispatcher",
    label: "For Dispatchers",
    tagline: "Manage your drivers, book loads on their behalf",
    color: "#39ff14",
    videoId: "YOUR_DISPATCHER_YOUTUBE_ID", // replace with your YouTube video ID
    features: [
      "Onboard drivers with a single invite link",
      "Book loads on behalf of your drivers",
      "Manage your full driver roster",
      "Upload and store driver documents",
      "Track all active and booked loads",
      "Message brokers directly from the dashboard",
    ],
    cta: "Start Managing Drivers",
  },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("broker")
  const active = tabs.find((t) => t.id === activeTab)!

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ background: "#070709" }}>

      {/* NAV */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(57,255,20,0.08)" }}
      >
        <a href="/"><BoxalooWordmark size="md" /></a>
        <nav className="hidden md:flex items-center gap-6">
          <a href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a
            href="/"
            className="text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#39ff14", color: "#070709" }}
          >
            Get Started
          </a>
        </nav>
      </header>

      {/* HERO */}
      <div className="text-center px-6 pt-16 pb-10 relative">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(57,255,20,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="inline-block text-xs font-mono px-3 py-1 rounded-full mb-4"
          style={{
            background: "rgba(57,255,20,0.08)",
            border: "1px solid rgba(57,255,20,0.2)",
            color: "#39ff14",
            letterSpacing: "3px",
          }}
        >
          &gt; LIVE DEMO
        </div>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
          See Boxaloo<br />
          <span style={{ color: "#39ff14" }}>In Action</span>
        </h1>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          Watch how brokers, carriers, and dispatchers use Boxaloo to move freight faster. No signup required.
        </p>
      </div>

      {/* TABS */}
      <div className="max-w-5xl mx-auto w-full px-6 pb-4">
        <div
          className="flex gap-2 p-1 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(57,255,20,0.08)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200"
              style={activeTab === tab.id ? {
                background: "rgba(57,255,20,0.1)",
                color: "#39ff14",
                border: "1px solid rgba(57,255,20,0.2)",
              } : {
                color: "#444",
                border: "1px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto w-full px-6 pb-20 flex flex-col gap-8">

        {/* Tagline */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-mono" style={{ color: "#555", letterSpacing: "2px" }}>
            {active.tagline.toUpperCase()}
          </p>
        </div>

        {/* Video + Features grid */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Video — takes 3 cols */}
          <div className="lg:col-span-3">
            <div
              className="rounded-xl overflow-hidden relative"
              style={{
                border: "1px solid rgba(57,255,20,0.15)",
                background: "#0c0c0f",
                boxShadow: "0 0 40px rgba(57,255,20,0.05)",
              }}
            >
              {/* Corner markers */}
              {["tl", "tr", "bl", "br"].map((c) => (
                <div
                  key={c}
                  className="absolute"
                  style={{
                    width: 16, height: 16,
                    top: c.startsWith("t") ? 8 : "auto",
                    bottom: c.startsWith("b") ? 8 : "auto",
                    left: c.endsWith("l") ? 8 : "auto",
                    right: c.endsWith("r") ? 8 : "auto",
                    borderTop: c.startsWith("t") ? "1px solid rgba(57,255,20,0.4)" : "none",
                    borderBottom: c.startsWith("b") ? "1px solid rgba(57,255,20,0.4)" : "none",
                    borderLeft: c.endsWith("l") ? "1px solid rgba(57,255,20,0.4)" : "none",
                    borderRight: c.endsWith("r") ? "1px solid rgba(57,255,20,0.4)" : "none",
                    zIndex: 2,
                  }}
                />
              ))}

              {/* Top bar */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(57,255,20,0.08)" }}
              >
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                  <div className="size-2.5 rounded-full" style={{ background: "#febc2e" }} />
                  <div className="size-2.5 rounded-full" style={{ background: "#28c840" }} />
                </div>
                <span
                  className="text-[10px] font-mono ml-2"
                  style={{ color: "rgba(57,255,20,0.3)", letterSpacing: "2px" }}
                >
                  BOXALOO · {active.label.toUpperCase()} DEMO
                </span>
              </div>

              {/* YouTube embed */}
              {active.videoId.startsWith("YOUR_") ? (
                // Placeholder when no video ID set yet
                <div
                  className="flex flex-col items-center justify-center gap-4"
                  style={{ aspectRatio: "16/9", background: "#0a0a0d" }}
                >
                  <div
                    className="size-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)" }}
                  >
                    <svg viewBox="0 0 24 24" className="size-7" fill="#39ff14">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                  <p className="text-sm font-mono" style={{ color: "#333", letterSpacing: "2px" }}>
                    VIDEO COMING SOON
                  </p>
                </div>
              ) : (
                <div style={{ aspectRatio: "16/9" }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${active.videoId}?rel=0&modestbranding=1&color=white`}
                    title={`Boxaloo ${active.label} Demo`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: "block" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Features — takes 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div
              className="rounded-xl p-6"
              style={{
                background: "#0c0c0f",
                border: "1px solid rgba(57,255,20,0.08)",
              }}
            >
              <p
                className="text-[10px] font-mono mb-4"
                style={{ color: "rgba(57,255,20,0.4)", letterSpacing: "3px", textTransform: "uppercase" }}
              >
                &gt; What you'll see
              </p>
              <ul className="flex flex-col gap-3">
                {active.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle className="size-4 shrink-0 mt-0.5" style={{ color: "#39ff14" }} />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <a
              href="/"
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
              style={{
                background: "#39ff14",
                color: "#070709",
                letterSpacing: "2px",
              }}
            >
              {active.cta} <ArrowRight className="size-4" />
            </a>

            <p className="text-center text-[11px] text-muted-foreground">
              {activeTab === "broker" ? "Free forever · No credit card needed" : "3-day free trial · Cancel anytime"}
            </p>
          </div>
        </div>

        {/* Bottom tab switcher hint */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-xs font-mono transition-colors"
              style={{
                color: activeTab === tab.id ? "#39ff14" : "#333",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {activeTab === tab.id ? "▶ " : ""}{tab.id}
            </button>
          ))}
        </div>

      </div>

      {/* FOOTER */}
      <footer
        className="border-t px-6 py-6 mt-auto"
        style={{ borderColor: "rgba(57,255,20,0.08)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BoxalooWordmark size="sm" />
          <p className="text-xs text-muted-foreground">© 2026 Boxaloo. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}