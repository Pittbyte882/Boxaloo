"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Truck, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { createClient } from "@supabase/supabase-js"
import type { EquipmentType } from "@/lib/mock-data"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

type DocKey = "mcLetter" | "insurance" | "w9" | "noa"

const docLabels: Record<DocKey, { label: string; required: boolean; field: string }> = {
  mcLetter: { label: "MC Authority Letter", required: true, field: "mc_letter_url" },
  insurance: { label: "Certificate of Insurance", required: true, field: "insurance_url" },
  w9: { label: "W-9 Form", required: true, field: "w9_url" },
  noa: { label: "Notice of Assignment", required: false, field: "noa_url" },
}

export default function DriverOnboardingPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [dispatcherId, setDispatcherId] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<DocKey, File | null>>({
    mcLetter: null, insurance: null, w9: null, noa: null,
  })
  const [fileNames, setFileNames] = useState<Record<DocKey, string>>({
    mcLetter: "", insurance: "", w9: "", noa: "",
  })
  const [formData, setFormData] = useState({
    name: "", company: "", mc: "", dot: "", phone: "", email: "", equipmentType: "",
  })

  useEffect(() => {
    if (!token) return
    // Validate token and get dispatcher info
    const validateToken = async () => {
      const { data } = await supabase
        .from("driver_invites")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .single()
      if (data) {
        setDispatcherId(data.dispatcher_id)
        setFormData((p) => ({ ...p, email: data.email }))
      }
    }
    validateToken()
  }, [token])

  const handleFileChange = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFiles((p) => ({ ...p, [key]: file }))
    setFileNames((p) => ({ ...p, [key]: file.name }))
  }

  const uploadFile = async (key: DocKey, driverName: string): Promise<string | null> => {
    const file = files[key]
    if (!file) return null
    const ext = file.name.split(".").pop()
    const path = `${dispatcherId}/${driverName.replace(/\s+/g, "-")}-${key}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from("driver-documents")
      .upload(path, file, { upsert: true })
    if (error) {
      console.error(`Upload error for ${key}:`, error)
      return null
    }
    const { data } = supabase.storage.from("driver-documents").getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate required docs
    const missingDocs = (Object.keys(docLabels) as DocKey[]).filter(
      (key) => docLabels[key].required && !files[key]
    )
    if (missingDocs.length > 0) {
      setError(`Please upload required documents: ${missingDocs.map((k) => docLabels[k].label).join(", ")}`)
      return
    }

    if (!formData.equipmentType) {
      setError("Please select an equipment type")
      return
    }

    setUploading(true)
    try {
      // Upload all files
      const [mcLetterUrl, insuranceUrl, w9Url, noaUrl] = await Promise.all([
        uploadFile("mcLetter", formData.name),
        uploadFile("insurance", formData.name),
        uploadFile("w9", formData.name),
        uploadFile("noa", formData.name),
      ])

      // Submit to API
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dispatcher_id: dispatcherId,
          token,
          mc_letter_url: mcLetterUrl,
          insurance_url: insuranceUrl,
          w9_url: w9Url,
          noa_url: noaUrl,
        }),
      })

      if (!res.ok) throw new Error("Submission failed")
      setSubmitted(true)
    } catch (err) {
      setError("Something went wrong. Please try again.")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">This invite link is invalid or has expired. Please contact your dispatcher for a new invite.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Submitted!</h1>
          <p className="text-sm text-muted-foreground">Your information and documents have been sent to your dispatcher. They will review and verify your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <Truck className="size-6 text-primary" />
        <span className="text-lg font-bold tracking-tight text-foreground">BOXALOO</span>
        <span className="text-xs text-muted-foreground ml-2">Driver Onboarding</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Complete Your Driver Profile</h1>
        <p className="text-sm text-muted-foreground mb-8">Fill in your information and upload required documents to get started.</p>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-6">
            <AlertCircle className="size-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Full Name</Label>
              <Input className="bg-card border-border text-foreground" placeholder="Your name" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Company Name</Label>
              <Input className="bg-card border-border text-foreground" placeholder="Company LLC" required value={formData.company} onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Email</Label>
            <Input className="bg-card border-border text-foreground" type="email" placeholder="driver@company.com" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">MC #</Label>
              <Input className="bg-card border-border text-foreground font-mono" placeholder="MC-000000" required value={formData.mc} onChange={(e) => setFormData((p) => ({ ...p, mc: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">DOT #</Label>
              <Input className="bg-card border-border text-foreground font-mono" placeholder="DOT-0000000" required value={formData.dot} onChange={(e) => setFormData((p) => ({ ...p, dot: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Phone</Label>
            <Input className="bg-card border-border text-foreground" placeholder="(555) 000-0000" required value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Equipment Type</Label>
            <Select value={formData.equipmentType} onValueChange={(v) => setFormData((p) => ({ ...p, equipmentType: v }))}>
              <SelectTrigger className="bg-card border-border text-foreground">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {equipmentTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document uploads */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Documents</p>
            <div className="flex flex-col gap-3">
              {(Object.keys(docLabels) as DocKey[]).map((key) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    files[key]
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileChange(key, e)}
                    required={docLabels[key].required}
                  />
                  {files[key] ? (
                    <CheckCircle className="size-5 text-primary shrink-0" />
                  ) : (
                    <Upload className="size-5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {docLabels[key].label}
                      {!docLabels[key].required && <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {fileNames[key] || "PDF, JPG, or PNG — Click to upload"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2">
            {uploading ? "Uploading & Submitting..." : "Submit Profile"}
          </Button>
        </form>
      </main>
    </div>
  )
}