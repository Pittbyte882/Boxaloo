"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Key, Copy, CheckCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Method = "POST" | "PATCH" | "DELETE"

const methodColor: Record<Method, string> = {
  POST: "bg-primary/15 text-primary",
  PATCH: "bg-[#4d9efe]/15 text-[#4d9efe]",
  DELETE: "bg-destructive/15 text-destructive",
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-lg overflow-hidden border border-border mt-3">
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono font-semibold">Example</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors font-mono">
          {copied ? <><CheckCircle className="size-3 text-primary" /> Copied</> : <><Copy className="size-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 text-xs text-foreground font-mono overflow-x-auto leading-relaxed bg-black/20">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Endpoint({
  method, path, description, requestBody, responseBody, notes,
}: {
  method: Method
  path: string
  description: string
  requestBody?: Record<string, { type: string; required: boolean; description: string }>
  responseBody: string
  notes?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 bg-card hover:bg-accent/30 transition-colors text-left"
      >
        <span className={`text-[11px] font-bold font-mono uppercase px-2.5 py-1 rounded ${methodColor[method]}`}>
          {method}
        </span>
        <code className="text-sm text-foreground font-mono flex-1">{path}</code>
        <span className="text-xs text-muted-foreground hidden sm:block flex-1">{description}</span>
        {open ? <ChevronUp className="size-4 text-muted-foreground shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="p-5 border-t border-border bg-background space-y-5">
          <p className="text-sm text-muted-foreground">{description}</p>

          {requestBody && (
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Request Body</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-card">
                      <th className="text-left p-3 text-muted-foreground font-semibold uppercase tracking-wider">Field</th>
                      <th className="text-left p-3 text-muted-foreground font-semibold uppercase tracking-wider">Type</th>
                      <th className="text-left p-3 text-muted-foreground font-semibold uppercase tracking-wider">Required</th>
                      <th className="text-left p-3 text-muted-foreground font-semibold uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(requestBody).map(([field, meta]) => (
                      <tr key={field} className="border-b border-border last:border-0">
                        <td className="p-3 font-mono text-primary">{field}</td>
                        <td className="p-3 text-muted-foreground font-mono">{meta.type}</td>
                        <td className="p-3">
                          {meta.required
                            ? <span className="text-destructive font-semibold">Required</span>
                            : <span className="text-muted-foreground">Optional</span>}
                        </td>
                        <td className="p-3 text-muted-foreground">{meta.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Response</p>
            <CodeBlock code={responseBody} />
          </div>

          {notes && (
            <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-primary text-xs mt-0.5">ℹ</span>
              <p className="text-xs text-muted-foreground">{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApiDocsPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const copyBaseUrl = () => {
    navigator.clipboard.writeText("https://loads.boxaloo.com/api/loads")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="font-mono text-xl font-bold tracking-widest text-foreground hover:opacity-80 transition-opacity">
            BOX<span className="text-primary">ALOO</span>
          </button>
          <Badge className="bg-primary/10 text-primary border-0 font-mono text-xs">
            <Key className="size-3 mr-1" /> API Docs
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Hero */}
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Boxaloo API Reference</h1>
          <p className="text-muted-foreground leading-relaxed">
            The Boxaloo API lets approved brokers post, update, and delete loads directly from their TMS or custom software.
            All requests require a valid API key.
          </p>
        </div>

        {/* Base URL */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Base URL</p>
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/30 border border-border font-mono text-sm text-primary">
            <span>https://loads.boxaloo.com/api/loads</span>
            <button onClick={copyBaseUrl} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
              {copied ? <CheckCircle className="size-4 text-primary" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>

        {/* Authentication */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Authentication</p>
          <p className="text-sm text-muted-foreground">
            Include your API key in the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">Authorization</code> header of every request.
          </p>
          <CodeBlock code={`Authorization: Bearer bxl_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
          <div className="flex gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 mt-2">
            <span className="text-destructive text-xs mt-0.5">⚠</span>
            <p className="text-xs text-muted-foreground">Never expose your API key in client-side code or public repositories. Treat it like a password.</p>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Rate Limits</p>
          <p className="text-sm text-muted-foreground">
            Requests are limited to <strong className="text-foreground">100 per hour</strong> per API key.
            Exceeding this limit returns a <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">429</code> status code.
            Rate limits reset on a rolling 1-hour window.
          </p>
          <CodeBlock code={`// 429 response when rate limit exceeded
{
  "error": "Rate limit exceeded. Max 100 requests/hour."
}`} />
        </div>

        {/* Equipment Types */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Valid Equipment Types</p>
          <p className="text-sm text-muted-foreground">The <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">equipment_type</code> field must be one of the following values:</p>
          <div className="flex flex-wrap gap-2">
            {["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"].map((t) => (
              <code key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded font-mono">{t}</code>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div>
          <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Endpoints</p>

          <Endpoint
            method="POST"
            path="/api/loads"
            description="Create a new load on the Boxaloo load board."
            requestBody={{
              pickup_city:   { type: "string", required: true,  description: "Pickup city name" },
              pickup_state:  { type: "string", required: true,  description: "Pickup state abbreviation e.g. TX" },
              dropoff_city:  { type: "string", required: true,  description: "Dropoff city name" },
              dropoff_state: { type: "string", required: true,  description: "Dropoff state abbreviation e.g. CA" },
              equipment_type:{ type: "string", required: true,  description: "See valid equipment types above" },
              pay_rate:      { type: "number", required: true,  description: "Pay rate in USD e.g. 1200" },
              total_miles:   { type: "number", required: false, description: "Total trip miles" },
              pickup_date:   { type: "string", required: false, description: "ISO date string e.g. 2026-04-01" },
              dropoff_date:  { type: "string", required: false, description: "ISO date string e.g. 2026-04-03" },
              weight:        { type: "number", required: false, description: "Load weight in lbs" },
              notes:         { type: "string", required: false, description: "Additional load details" },
            }}
            responseBody={`// 201 Created
{
  "success": true,
  "load_id": "BXL-M8F3K2",
  "load": {
    "id": "BXL-M8F3K2",
    "pickup_city": "Dallas",
    "pickup_state": "TX",
    "dropoff_city": "Los Angeles",
    "dropoff_state": "CA",
    "equipment_type": "Box Truck",
    "pay_rate": 2400,
    "total_miles": 1430,
    "status": "Available",
    "created_at": "2026-04-01T10:00:00Z"
  }
}`}
            notes="Loads are immediately visible on the Boxaloo load board after creation. Your MC number is automatically attached from your API key."
          />

          <Endpoint
            method="PATCH"
            path="/api/loads"
            description="Update an existing load. You can only update loads posted by your MC number."
            requestBody={{
              load_id:       { type: "string", required: true,  description: "The load ID returned when the load was created" },
              pickup_city:   { type: "string", required: false, description: "Updated pickup city" },
              pickup_state:  { type: "string", required: false, description: "Updated pickup state" },
              dropoff_city:  { type: "string", required: false, description: "Updated dropoff city" },
              dropoff_state: { type: "string", required: false, description: "Updated dropoff state" },
              equipment_type:{ type: "string", required: false, description: "Updated equipment type" },
              pay_rate:      { type: "number", required: false, description: "Updated pay rate" },
              total_miles:   { type: "number", required: false, description: "Updated miles" },
              pickup_date:   { type: "string", required: false, description: "Updated pickup date" },
              dropoff_date:  { type: "string", required: false, description: "Updated dropoff date" },
              weight:        { type: "number", required: false, description: "Updated weight in lbs" },
              status:        { type: "string", required: false, description: "Available or Booked" },
              notes:         { type: "string", required: false, description: "Updated load details" },
            }}
            responseBody={`// 200 OK
{
  "success": true,
  "load": {
    "id": "BXL-M8F3K2",
    "pay_rate": 2600,
    "status": "Available",
    ...
  }
}`}
            notes="Only include the fields you want to update. All other fields remain unchanged."
          />

          <Endpoint
            method="DELETE"
            path="/api/loads"
            description="Delete a load from the board. You can only delete loads posted by your MC number."
            requestBody={{
              load_id: { type: "string", required: true, description: "The ID of the load to delete" },
            }}
            responseBody={`// 200 OK
{
  "success": true
}`}
            notes="Deleted loads are permanently removed and cannot be recovered. Carriers who had active requests on the load will no longer see it."
          />
        </div>

        {/* Error codes */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Error Codes</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left p-3 text-muted-foreground font-semibold uppercase tracking-wider">Code</th>
                  <th className="text-left p-3 text-muted-foreground font-semibold uppercase tracking-wider">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["400", "Bad request — missing or invalid fields"],
                  ["401", "Unauthorized — invalid or missing API key"],
                  ["403", "Forbidden — your key lacks permission or you don't own this load"],
                  ["404", "Not found — load ID does not exist"],
                  ["429", "Rate limit exceeded — max 100 requests/hour"],
                  ["500", "Server error — try again or contact support"],
                ].map(([code, meaning]) => (
                  <tr key={code} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-primary">{code}</td>
                    <td className="p-3 text-muted-foreground">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Example integration */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Example Integration</p>
          <p className="text-sm text-muted-foreground">Post a load using fetch in Node.js:</p>
          <CodeBlock code={`const response = await fetch("https://loads.boxaloo.com/api/loads", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer bxl_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  body: JSON.stringify({
    pickup_city: "Dallas",
    pickup_state: "TX",
    dropoff_city: "Los Angeles",
    dropoff_state: "CA",
    equipment_type: "Box Truck",
    pay_rate: 2400,
    total_miles: 1430,
    pickup_date: "2026-04-01",
    dropoff_date: "2026-04-03",
    weight: 8000,
    notes: "Liftgate required at delivery"
  })
})

const data = await response.json()
console.log(data.load_id) // "BXL-M8F3K2"`} />
        </div>

        {/* Support */}
        <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-bold text-foreground mb-1">Need help with your integration?</p>
            <p className="text-xs text-muted-foreground">Our team is available to help you get set up.</p>
          </div>
          <a href="mailto:support@boxaloo.com?subject=API Integration Help"
            className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
            Contact Support
          </a>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground font-mono">© 2026 Boxaloo · API v1</p>
        </div>

      </div>
    </div>
  )
}