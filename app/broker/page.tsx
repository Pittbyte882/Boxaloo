"use client"

import { useState, useEffect, useRef } from "react"
import {
  Package, Plus, DollarSign, CheckCircle, Clock, Trash2,
  ToggleLeft, ToggleRight, Truck, Pencil, MessageSquare,
  Search, Download, Upload, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-nav"
import { MessageThread } from "@/components/message-thread"
import {
  useLoads, useLoadRequests, useMessages, usePostedTrucks,
  updatePostedTruck, createLoad, updateLoad, deleteLoadApi, updateLoadRequest,
} from "@/hooks/use-api"
import type { EquipmentType, LoadStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]
const ALLOWED_EQUIPMENT = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

function formatMiles(miles?: number | null) {
  if (!miles) return "—"
  return `${miles.toLocaleString()} mi`
}

export default function BrokerDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [editingLoad, setEditingLoad] = useState<any>(null)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [requestSearch, setRequestSearch] = useState("")
  const [requestMiles, setRequestMiles] = useState<Record<string, number | null>>({})

  // CSV state
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvResults, setCsvResults] = useState<{
    success: number
    failed: { row: number; reason: string }[]
  } | null>(null)
  const [showCsvResults, setShowCsvResults] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    pickup_city: "", pickup_state: "",
    dropoff_city: "", dropoff_state: "",
    pickup_date: "", dropoff_date: "",
    equipment_type: "" as EquipmentType | "",
    total_miles: "", weight: "", pay_rate: "", details: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) setCurrentUser(JSON.parse(stored))
  }, [])

  const brokerName = currentUser?.name || currentUser?.company || ""
  const brokerId = currentUser?.id || ""

  const { data: loads = [], isLoading, mutate: fetchLoads } = useLoads({ brokerId })
  const { data: allRequests = [], mutate: fetchRequests } = useLoadRequests()
  const { data: messages = [], mutate: fetchMessages } = useMessages()
  const { data: availableTrucks = [] } = usePostedTrucks()

  const myLoadIds = new Set(loads.map((l) => l.id))
  const requests = allRequests.filter((r) => myLoadIds.has((r.load_id ?? r.loadId) as string))

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const availableLoads = loads.filter((l) => (l.status ?? "Available") === "Available")
  const bookedLoads = loads.filter((l) => l.status === "Booked")

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAcceptRequest = async (reqId: string) => {
    await updateLoadRequest(reqId, { status: "accepted" })
    fetchRequests()
  }

  const handleDeclineRequest = async (reqId: string) => {
    await updateLoadRequest(reqId, { status: "declined" })
    fetchRequests()
  }

  const handleToggleStatus = async (loadId: string, current: string) => {
    const next = current === "Available" ? "Booked" : "Available"
    await updateLoad(loadId, { status: next as LoadStatus })
    fetchLoads()
  }

  const handleDelete = async (loadId: string) => {
    if (!confirm("Delete this load?")) return
    await deleteLoadApi(loadId)
    fetchLoads()
  }

  const handleEdit = (load: any) => {
    setEditingLoad(load)
    setForm({
      pickup_city: load.pickup_city ?? "",
      pickup_state: load.pickup_state ?? "",
      dropoff_city: load.dropoff_city ?? "",
      dropoff_state: load.dropoff_state ?? "",
      pickup_date: load.pickup_date ?? "",
      dropoff_date: load.dropoff_date ?? "",
      equipment_type: load.equipment_type ?? "",
      total_miles: load.total_miles?.toString() ?? "",
      weight: load.weight?.toString() ?? "",
      pay_rate: load.pay_rate?.toString() ?? "",
      details: load.details ?? "",
    })
    setShowPostModal(true)
  }

  const handleSubmit = async () => {
  if (!form.pickup_city || !form.pickup_state || !form.dropoff_city || !form.dropoff_state || !form.equipment_type || !form.pay_rate) {
  alert(`Missing: city=${form.pickup_city} state=${form.pickup_state} equip=${form.equipment_type} pay=${form.pay_rate}`)
  return
}
  setSubmitting(true)
  try {
    if (editingLoad) {
      await updateLoad(editingLoad.id, {
        pickup_city: form.pickup_city,
        pickup_state: form.pickup_state,
        dropoff_city: form.dropoff_city,
        dropoff_state: form.dropoff_state,
        pickup_date: form.pickup_date || null,
        dropoff_date: form.dropoff_date || null,
        equipment_type: form.equipment_type as EquipmentType,
        total_miles: form.total_miles ? Number(form.total_miles) : 0,
        weight: form.weight ? Number(form.weight) : 0,
        pay_rate: Number(form.pay_rate),
        details: form.details,
      })
    } else {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "",
        },
        body: JSON.stringify({
          pickup_city: form.pickup_city,
          pickup_state: form.pickup_state,
          dropoff_city: form.dropoff_city,
          dropoff_state: form.dropoff_state,
          pickup_date: form.pickup_date || null,
          dropoff_date: form.dropoff_date || null,
          equipment_type: form.equipment_type,
          load_type: null,
          total_miles: form.total_miles ? Number(form.total_miles) : 0,
          weight: form.weight ? Number(form.weight) : 0,
          pay_rate: Number(form.pay_rate),
          details: form.details,
          broker_id: brokerId,
          broker_name: brokerName,
          broker_mc: currentUser?.broker_mc ?? "",
          status: "Available",
          upload_source: "manual",
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Failed to post load")
        return
      }
    }
    fetchLoads()
    setShowPostModal(false)
    setEditingLoad(null)
    setForm({ pickup_city: "", pickup_state: "", dropoff_city: "", dropoff_state: "", pickup_date: "", dropoff_date: "", equipment_type: "", total_miles: "", weight: "", pay_rate: "", details: "" })
  } finally {
    setSubmitting(false)
  }
}

  // ── CSV Handlers ───────────────────────────────────────────────────────────

  const handleDownloadTemplate = () => {
    const headers = [
      "pickup_city", "pickup_state", "dropoff_city", "dropoff_state",
      "equipment_type", "pay_rate", "pickup_date", "dropoff_date",
      "total_miles", "weight", "notes"
    ]
    const example = [
      "Dallas", "TX", "Houston", "TX",
      "Box Truck", "850", "2026-09-01", "2026-09-01",
      "240", "1200", "Fragile items liftgate required"
    ]
    const csv = [headers.join(","), example.join(",")].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "boxaloo_load_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvUploading(true)
    setCsvResults(null)

    const text = await file.text()
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const rows = lines.slice(1)

    let success = 0
    const failed: { row: number; reason: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const values = rows[i].split(",").map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || "" })
      const rowNum = i + 2

      if (!row.pickup_city || !row.pickup_state || !row.dropoff_city || !row.dropoff_state) {
        failed.push({ row: rowNum, reason: "Missing city or state fields" })
        continue
      }
      if (!row.equipment_type || !ALLOWED_EQUIPMENT.includes(row.equipment_type)) {
        failed.push({ row: rowNum, reason: `Invalid equipment type "${row.equipment_type}". Must be: ${ALLOWED_EQUIPMENT.join(", ")}` })
        continue
      }
      if (!row.pay_rate || Number(row.pay_rate) < 50) {
        failed.push({ row: rowNum, reason: "pay_rate must be at least $50" })
        continue
      }
      if (!row.notes || row.notes.length < 10) {
        failed.push({ row: rowNum, reason: "notes must be at least 10 characters" })
        continue
      }

      try {
        const res = await fetch("/api/loads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "",
          },
          body: JSON.stringify({
            pickup_city: row.pickup_city,
            pickup_state: row.pickup_state,
            dropoff_city: row.dropoff_city,
            dropoff_state: row.dropoff_state,
            equipment_type: row.equipment_type,
            pay_rate: Number(row.pay_rate),
            pickup_date: row.pickup_date || null,
            dropoff_date: row.dropoff_date || null,
            total_miles: row.total_miles ? Number(row.total_miles) : 0,
            weight: row.weight ? Number(row.weight) : 0,
            details: row.notes,
            upload_source: "csv",
            broker_id: currentUser?.id,
            broker_name: brokerName,
            broker_mc: currentUser?.broker_mc,
            status: "Available",
          }),
        })
        if (res.ok) {
          success++
        } else {
          const err = await res.json()
          failed.push({ row: rowNum, reason: err.error || "Failed to post" })
        }
      } catch {
        failed.push({ row: rowNum, reason: "Network error" })
      }
    }

    setCsvResults({ success, failed })
    setShowCsvResults(true)
    setCsvUploading(false)
    e.target.value = ""
    if (success > 0) fetchLoads()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardShell role="broker" userName={brokerName}>
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active Loads", value: availableLoads.length, icon: Package, color: "text-primary" },
            { label: "Booked Loads", value: bookedLoads.length, icon: CheckCircle, color: "text-green-400" },
            { label: "Pending Requests", value: pendingRequests.length, icon: Clock, color: "text-[#ffd166]" },
            { label: "Total Loads", value: loads.length, icon: DollarSign, color: "text-blue-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("size-9 rounded-lg bg-muted flex items-center justify-center", color)}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => { setEditingLoad(null); setShowPostModal(true) }}
            className="bg-primary text-primary-foreground font-bold"
          >
            <Plus className="size-4 mr-2" /> Post Load
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="border-border text-muted-foreground hover:text-foreground h-9 text-sm"
          >
            <Download className="size-4 mr-2" />
            CSV Template
          </Button>
          <label className={cn(
            "inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-medium cursor-pointer transition-colors",
            csvUploading
              ? "opacity-50 cursor-not-allowed text-muted-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}>
            {csvUploading ? (
              <><Loader2 className="size-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="size-4" /> Bulk Upload CSV</>
            )}
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              disabled={csvUploading}
              onChange={handleCsvUpload}
            />
          </label>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="loads" className="space-y-4">
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
            <TabsList className="bg-card border border-border w-max lg:w-auto">
              <TabsTrigger value="loads" className="text-base">
                My Loads
                {loads.length > 0 && (
                  <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{loads.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests" className="text-base">
                Requests
                {pendingRequests.length > 0 && (
                  <Badge className="ml-2 bg-[#ffd166]/20 text-[#ffd166] border-0 text-[10px] px-1.5">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="trucks" className="text-base">Available Trucks</TabsTrigger>
              <TabsTrigger value="messages" className="text-base">
                Messages
                {messages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "broker").length > 0 && (
                  <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                    {messages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "broker").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── My Loads Tab ── */}
          <TabsContent value="loads">
            {isLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="size-8 text-primary animate-spin mx-auto" />
              </div>
            ) : loads.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-semibold">No loads posted yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click Post Load or upload a CSV to get started</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {loads.map((load) => (
                  <Card key={load.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={cn(
                              "border-0 text-[11px] uppercase font-bold tracking-wider",
                              (load.status ?? "Available") === "Available"
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {load.status ?? "Available"}
                            </Badge>
                            {load.upload_source === "csv" && (
                              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">CSV</Badge>
                            )}
                            {load.upload_source === "api" && (
                              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">API</Badge>
                            )}
                            <span className="text-xs font-mono text-muted-foreground">{load.id}</span>
                          </div>
                          <p className="font-bold text-foreground">
                            {load.pickup_city}, {load.pickup_state} → {load.dropoff_city}, {load.dropoff_state}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {load.equipment_type} &middot; {formatMiles(load.total_miles)} &middot;{" "}
                            <span className="text-primary font-mono font-bold">${(load.pay_rate ?? 0).toLocaleString()}</span>
                          </p>
                          {(load.pickup_date || load.dropoff_date) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {load.pickup_date && <>Pickup: {load.pickup_date}</>}
                              {load.dropoff_date && <> &middot; Dropoff: {load.dropoff_date}</>}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <Button size="sm" variant="outline"
                            onClick={() => handleEdit(load)}
                            className="h-7 text-xs border-border text-muted-foreground">
                            <Pencil className="size-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => handleToggleStatus(load.id, load.status ?? "Available")}
                            className="h-7 text-xs border-border text-muted-foreground">
                            {(load.status ?? "Available") === "Available"
                              ? <><ToggleRight className="size-3 mr-1" /> Mark Booked</>
                              : <><ToggleLeft className="size-3 mr-1" /> Mark Available</>}
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => handleDelete(load.id)}
                            className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10">
                            <Trash2 className="size-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Requests Tab ── */}
          <TabsContent value="requests">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by driver, company, MC#, route..."
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="pl-10 bg-card border-border text-foreground h-10"
              />
            </div>
            <div className="flex flex-col gap-3">
              {requests
                .filter((req) => {
                  if (!requestSearch) return true
                  const q = requestSearch.toLowerCase()
                  const load = loads.find((l) => l.id === (req.load_id ?? req.loadId))
                  return (
                    (req.driver_name ?? req.driverName ?? "").toLowerCase().includes(q) ||
                    (req.company_name ?? req.companyName ?? "").toLowerCase().includes(q) ||
                    (req.mc_number ?? req.mc ?? "").toLowerCase().includes(q) ||
                    (req.load_id ?? req.loadId ?? "").toLowerCase().includes(q) ||
                    (load?.pickup_city ?? "").toLowerCase().includes(q) ||
                    (load?.dropoff_city ?? "").toLowerCase().includes(q)
                  )
                })
                .map((req) => {
                  const load = loads.find((l) => l.id === (req.load_id ?? req.loadId))
                  const isExpanded = activeRequestId === req.id
                  const loadMsgs = messages.filter((m) => (m.load_id ?? m.loadId) === (req.load_id ?? req.loadId))

                  return (
                    <Card key={req.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge className={cn(
                                "border-0 text-[11px] uppercase font-bold tracking-wider",
                                req.status === "accepted" ? "bg-primary/15 text-primary"
                                  : req.status === "declined" || req.status === "rejected" ? "bg-destructive/15 text-destructive"
                                    : "bg-[#ffd166]/15 text-[#ffd166]"
                              )}>
                                {req.status}
                              </Badge>
                              <span className="text-sm font-mono text-muted-foreground">{req.load_id ?? req.loadId}</span>
                              <Badge variant="outline" className="text-[11px] border-border text-muted-foreground capitalize">
                                {req.requester_type ?? req.type}
                              </Badge>
                            </div>
                            {load && (
                              <p className="font-bold text-foreground text-base mb-1">
                                {load.pickup_city}, {load.pickup_state} → {load.dropoff_city}, {load.dropoff_state}
                              </p>
                            )}
                            <p className="text-base text-foreground font-medium">
                              {req.driver_name ?? req.driverName} &middot; {req.company_name ?? req.companyName}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              MC: <span className="font-mono text-foreground">{req.mc_number ?? req.mc}</span>
                              {(req.truck_type ?? req.truckType) && <> &middot; {req.truck_type ?? req.truckType}</>}
                            </p>
                            {req.phone && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                📞 <span className="text-foreground">{req.phone}</span>
                                {req.requester_email && <> &middot; <span className="text-foreground">{req.requester_email}</span></>}
                              </p>
                            )}
                            {(req.truck_location ?? req.currentLocation) && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                📍 <span className="text-foreground">{req.truck_location ?? req.currentLocation}</span>
                              </p>
                            )}
                            {load && (
                              <p className="text-sm text-foreground font-medium mt-0.5">
                                {load.equipment_type} &middot; {formatMiles(load.total_miles)} &middot;{" "}
                                <span className="text-primary font-mono font-bold">${(load.pay_rate ?? 0).toLocaleString()}</span>
                              </p>
                            )}
                            {(req.counter_offer ?? req.counterOfferPrice) && (
                              <p className="text-sm text-[#ffd166] font-mono mt-1">
                                Counter Offer: ${(req.counter_offer ?? req.counterOfferPrice ?? 0).toLocaleString()}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <Button size="sm" variant="outline"
                              onClick={() => setActiveRequestId(isExpanded ? null : req.id)}
                              className={cn(
                                "h-8 text-xs border-border",
                                isExpanded ? "text-primary border-primary/50" : "text-muted-foreground"
                              )}>
                              <MessageSquare className="size-3 mr-1" />
                              {isExpanded ? "Close" : "Message"}
                              {loadMsgs.length > 0 && (
                                <span className="ml-1 size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                                  {loadMsgs.length}
                                </span>
                              )}
                            </Button>
                            {req.status === "pending" ? (
                              <>
                                <Button size="sm" onClick={() => handleAcceptRequest(req.id)}
                                  className="bg-primary text-primary-foreground h-8 text-sm font-bold">
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeclineRequest(req.id)}
                                  className="border-border text-muted-foreground h-8 text-sm">
                                  Decline
                                </Button>
                              </>
                            ) : (
                              <Badge className={cn(
                                "border-0 text-[11px] font-bold uppercase",
                                req.status === "accepted" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                              )}>
                                {req.status}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {isExpanded && load && (
                          <div className="mt-4 border-t border-border pt-4 h-[350px] rounded-lg border border-border bg-background overflow-hidden">
                            <MessageThread
                              messages={loadMsgs}
                              currentUserId={currentUser?.id ?? ""}
                              currentUserName={brokerName}
                              currentUserRole="broker"
                              load={load}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              {requests.length === 0 && (
                <div className="py-16 text-center">
                  <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-semibold">No requests yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Available Trucks Tab ── */}
          <TabsContent value="trucks">
            <div className="flex flex-col gap-3">
              {availableTrucks.filter((t) => t.status === "available").length === 0 ? (
                <div className="py-16 text-center">
                  <Truck className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-semibold">No trucks available right now</p>
                </div>
              ) : (
                availableTrucks.filter((t) => t.status === "available").map((truck) => (
                  <Card key={truck.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-foreground">{truck.driver_name ?? truck.driverName}</p>
                          <p className="text-sm text-muted-foreground">
                            {truck.equipment_type ?? truck.equipmentType} &middot; MC: {truck.mc_number ?? truck.mc}
                          </p>
                          {(truck.current_location ?? truck.currentLocation) && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              📍 {truck.current_location ?? truck.currentLocation}
                            </p>
                          )}
                          {truck.phone && (
                            <p className="text-sm text-muted-foreground mt-0.5">📞 {truck.phone}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline"
                          className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          onClick={async () => {
                            await updatePostedTruck(truck.id, { status: "hired" })
                          }}>
                          Hire Truck
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── Messages Tab ── */}
          <TabsContent value="messages">
            <div className="flex flex-col gap-3">
              {loads.map((load) => {
                const loadMsgs = messages.filter((m) => (m.load_id ?? m.loadId) === load.id)
                if (loadMsgs.length === 0) return null
                return (
                  <Card key={load.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="font-bold text-foreground mb-1">
                        {load.pickup_city}, {load.pickup_state} → {load.dropoff_city}, {load.dropoff_state}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mb-3">{load.id}</p>
                      <div className="h-[300px] rounded-lg border border-border bg-background overflow-hidden">
                        <MessageThread
                          messages={loadMsgs}
                          currentUserId={currentUser?.id ?? ""}
                          currentUserName={brokerName}
                          currentUserRole="broker"
                          load={load}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {loads.every((l) => messages.filter((m) => (m.load_id ?? m.loadId) === l.id).length === 0) && (
                <div className="py-16 text-center">
                  <MessageSquare className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-semibold">No messages yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Post / Edit Load Modal ── */}
      <Dialog open={showPostModal} onOpenChange={(o) => { setShowPostModal(o); if (!o) setEditingLoad(null) }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLoad ? "Edit Load" : "Post a Load"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Pickup City *</Label>
                <Input value={form.pickup_city} onChange={(e) => setForm({ ...form, pickup_city: e.target.value })}
                  className="bg-background border-border" placeholder="Dallas" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Pickup State *</Label>
                <Input value={form.pickup_state} onChange={(e) => setForm({ ...form, pickup_state: e.target.value })}
                  className="bg-background border-border" placeholder="TX" maxLength={2} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dropoff City *</Label>
                <Input value={form.dropoff_city} onChange={(e) => setForm({ ...form, dropoff_city: e.target.value })}
                  className="bg-background border-border" placeholder="Houston" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dropoff State *</Label>
                <Input value={form.dropoff_state} onChange={(e) => setForm({ ...form, dropoff_state: e.target.value })}
                  className="bg-background border-border" placeholder="TX" maxLength={2} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Pickup Date</Label>
                <Input type="date" value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
                  className="bg-background border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dropoff Date</Label>
                <Input type="date" value={form.dropoff_date} onChange={(e) => setForm({ ...form, dropoff_date: e.target.value })}
                  className="bg-background border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Equipment Type *</Label>
              <Select value={form.equipment_type} onValueChange={(v) => setForm({ ...form, equipment_type: v as EquipmentType })}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Miles</Label>
                <Input type="number" value={form.total_miles} onChange={(e) => setForm({ ...form, total_miles: e.target.value })}
                  className="bg-background border-border" placeholder="240" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Weight (lbs)</Label>
                <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="bg-background border-border" placeholder="1200" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Pay Rate ($) *</Label>
                <Input type="number" value={form.pay_rate} onChange={(e) => setForm({ ...form, pay_rate: e.target.value })}
                  className="bg-background border-border" placeholder="850" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Load Details *</Label>
              <Textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })}
                className="bg-background border-border min-h-[80px]"
                placeholder="Describe the load, special requirements, etc. (min 10 characters)" />
            </div>
            <Button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-bold">
              {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {editingLoad ? "Save Changes" : "Post Load"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CSV Results Modal ── */}
      {showCsvResults && csvResults && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-4">CSV Upload Results</h2>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{csvResults.success}</p>
                <p className="text-sm text-muted-foreground mt-1">Loads Posted</p>
              </div>
              <div className="flex-1 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-destructive">{csvResults.failed.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Rows Failed</p>
              </div>
            </div>
            {csvResults.failed.length > 0 && (
              <div className="space-y-2 mb-6">
                <p className="text-sm font-semibold text-foreground mb-2">Failed Rows:</p>
                {csvResults.failed.map((f, i) => (
                  <div key={i} className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-xs font-mono text-destructive">
                      Row {f.row}: <span className="text-foreground">{f.reason}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={() => setShowCsvResults(false)}
              className="w-full bg-primary text-primary-foreground font-bold">
              Done
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
