"use client"

import { useState } from "react"
import { Truck, Upload, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitOnboarding } from "@/hooks/use-api"
import type { EquipmentType } from "@/lib/mock-data"

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

type DocKey = "mcLetter" | "insurance" | "w9" | "noa"

const docLabels: Record<DocKey, { label: string; required: boolean }> = {
  mcLetter: { label: "MC Authority Letter", required: true },
  insurance: { label: "Certificate of Insurance", required: true },
  w9: { label: "W-9 Form", required: true },
  noa: { label: "Notice of Assignment", required: false },
}

export default function DriverOnboardingPage() {
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploads, setUploads] = useState<Record<DocKey, boolean>>({
    mcLetter: false,
    insurance: false,
    w9: false,
    noa: false,
  })
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    mc: "",
    dot: "",
    phone: "",
    equipmentType: "",
  })

  const toggleUpload = (key: DocKey) => {
    setUploads((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      await submitOnboarding({
        ...formData,
        email: "",
        documents: uploads,
      })
      setSubmitted(true)
    } catch {
      // handle error
    } finally {
      setUploading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Submitted!</h1>
          <p className="text-sm text-muted-foreground">
            Your information has been sent to your dispatcher. They will be notified once your documents are verified.
          </p>
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
        <p className="text-sm text-muted-foreground mb-8">
          Fill in your information and upload required documents to get started.
        </p>

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
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Required Documents</p>
            <div className="flex flex-col gap-3">
              {(Object.keys(docLabels) as DocKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleUpload(key)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    uploads[key]
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  {uploads[key] ? (
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
                      {uploads[key] ? "document_uploaded.pdf" : "PDF or JPEG - Click to upload"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2">
            {uploading ? "Submitting..." : "Submit Profile"}
          </Button>
        </form>
      </main>
    </div>
  )
}
