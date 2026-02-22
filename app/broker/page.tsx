"use client"

import { useState, useEffect } from "react"
import {
  Package, Plus, MessageSquare, DollarSign, CheckCircle,
  Clock, Trash2, ToggleLeft, ToggleRight,
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
import { CityAutocomplete } from "@/components/city-autocomplete"
import {
  useLoads, useLoadRequests, useMessages,
  createLoad, updateLoad, deleteLoadApi, updateLoadRequest,
} from "@/hooks/use-api"
import type { EquipmentType, LoadStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]
const loadTypes = ["FTL", "LTL"]

export default function BrokerDashboard() {
  const [postOpen, setPostOpen] = useState(false)
  const [messageLoadId, setMessageLoadId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [calculatingMiles, setCalculatingMiles] = useState(false)
  const [formData, setFormData] = useState({
    pickupLocation: "",
    pickupCity: "",
    pickupState: "",
    dropoffLocation: "",
    dropoffCity: "",
    dropoffState: "",
    equipmentType: "" as string,
    loadType: "" as string,
    weight: "",
    payRate: "",
    details: "",
    pickupDate: "",
    dropoffDate: "",
    totalMiles: "",
  })

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) setCurrentUser(JSON.parse(stored))
  }, [])

  const brokerMC = currentUser?.broker_mc || "MC-445291"
  const brokerId = currentUser?.id || ""
  const brokerName = currentUser?.name || currentUser?.company || "Swift Logistics"

  const { data: loads = [], isLoading } = useLoads({ brokerId: brokerId || undefined })
  const { data: allRequests = [] } = useLoadRequests()
  const { data: allMessages = [] } = useMessages()

  const brokerLoadIds = new Set(loads.map((l) => l.id))
  const requests = allRequests.filter((r) => brokerLoadIds.has((r.loadId ?? r.load_id) as string))
  console.log("broker loads:", loads.map(l => l.id))
  console.log("all requests:", allRequests.map(r => ({ id: r.id, load_id: r.load_id ?? r.loadId })))
  console.log("filtered requests:", requests.length)
  const messages = allMessages.filter((m) => brokerLoadIds.has((m.loadId ?? m.load_id) as string))

  const unreadCount = messages.filter((m) => !m.read && m.sender_id !== "broker").length
  const available = loads.filter((l) => l.status === "Available").length
  const booked = loads.filter((l) => l.status === "Booked").length
  const totalRevenue = loads.reduce((s, l) => s + (l.payRate ?? l.pay_rate ?? 0), 0)

  async function calculateMiles(pickup: string, dropoff: string) {
    if (!pickup || !dropoff) return
    setCalculatingMiles(true)
    try {
      const res = await fetch(
        `/api/here/distance?origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`
      )
      const data = await res.json()
      if (data.miles) {
        setFormData((p) => ({ ...p, totalMiles: String(data.miles) }))
      }
    } catch {
      console.error("Could not calculate miles")
    } finally {
      setCalculatingMiles(false)
    }
  }

  function handlePickupSelect(label: string, city: string, state: string) {
    setFormData((p) => ({ ...p, pickupLocation: label, pickupCity: city, pickupState: state }))
    if (formData.dropoffLocation) calculateMiles(label, formData.dropoffLocation)
  }

  function handleDropoffSelect(label: string, city: string, state: string) {
    setFormData((p) => ({ ...p, dropoffLocation: label, dropoffCity: city, dropoffState: state }))
    if (formData.pickupLocation) calculateMiles(formData.pickupLocation, label)
  }

  const toggleStatus = async (id: string, forceTo?: string) => {
    const load = loads.find((l) => l.id === id)
    if (!load) return
    const newStatus = forceTo ?? (load.status === "Available" ? "Booked" : "Available")
    await updateLoad(id, { status: newStatus as LoadStatus })
  }

  const handleDelete = async (id: string) => { await deleteLoadApi(id) }
  const handleAcceptRequest = async (reqId: string) => { await updateLoadRequest(reqId, { status: "accepted" }) }
  const handleDeclineRequest = async (reqId: string) => {
  console.log("declining request ID:", reqId)
  await updateLoadRequest(reqId, { status: "declined" })
  const req = requests.find((r) => r.id === reqId)
  const loadId = req?.load_id ?? req?.loadId
  if (loadId) await updateLoad(loadId, { status: "Available" })
}

  const handlePostLoad = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validate locations were properly selected from autocomplete
  if (!formData.pickupLocation || !formData.dropoffLocation) {
    alert("Please select a pickup and dropoff city from the dropdown")
    return
  }

  if (!formData.equipmentType) {
    alert("Please select an equipment type")
    return
  }

  const parseLocation = (loc: string) => {
      const parts = loc.split(",").map((s) => s.trim())
      return { city: parts[0] || loc, state: parts[1] || "" }
    }

    const pickup = formData.pickupCity
      ? { city: formData.pickupCity, state: formData.pickupState }
      : parseLocation(formData.pickupLocation)
    const dropoff = formData.dropoffCity
      ? { city: formData.dropoffCity, state: formData.dropoffState }
      : parseLocation(formData.dropoffLocation)

      // ADD THIS to see what console says 
  console.log("Submitting load:", {
    pickup_city: pickup.city,
    dropoff_city: dropoff.city,
    equipment_type: formData.equipmentType,
    pay_rate: formData.payRate,
  })

    await createLoad({
      pickup_city: pickup.city,
      pickup_state: pickup.state,
      dropoff_city: dropoff.city,
      dropoff_state: dropoff.state,
      pickup_date: formData.pickupDate || null,
      dropoff_date: formData.dropoffDate || null,
      total_miles: Number(formData.totalMiles) || Math.floor(Math.random() * 1200) + 100,
      equipment_type: formData.equipmentType as EquipmentType,
      load_type: formData.loadType || null,
      weight: Number(formData.weight) || 0,
      details: formData.details,
      pay_rate: Number(formData.payRate) || 0,
      broker_mc: brokerMC,
      broker_id: brokerId || null,
      broker_name: brokerName,
      status: "Available" as LoadStatus,
    })

    setPostOpen(false)
    setFormData({
      pickupLocation: "", pickupCity: "", pickupState: "",
      dropoffLocation: "", dropoffCity: "", dropoffState: "",
      equipmentType: "", loadType: "", pickupDate: "", dropoffDate: "",
      weight: "", payRate: "", details: "", totalMiles: "",
    })
  }

  return (
    <DashboardShell role="broker" unreadCount={unreadCount}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Broker Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{brokerName} &middot; {brokerMC}</p>
        </div>
        <Button onClick={() => setPostOpen(true)} className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90">
          <Plus className="size-4 mr-2" /> Post Load
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{loads.length}</p>
              <p className="text-xs text-muted-foreground">Total Loads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{available}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-accent flex items-center justify-center">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{booked}</p>
              <p className="text-xs text-muted-foreground">Booked</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">${totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="loads" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="loads">My Loads</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {requests.length > 0 && (
              <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{requests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages">
            Messages
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{unreadCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* My Loads */}
        <TabsContent value="loads">
          {isLoading ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">Loading loads...</p>
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
                            "text-[10px] font-bold uppercase tracking-wider border-0",
                            load.status === "Available" ? "bg-primary/15 text-primary"
                              : load.status === "Canceled" ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {load.status}
                          </Badge>
                          {(load.load_type ?? (load as any).loadType) && (
                            <Badge className="text-[10px] font-bold uppercase tracking-wider border-0 bg-blue-500/15 text-blue-400">
                              {load.load_type ?? (load as any).loadType}
                            </Badge>
                          )}
                          <span className="font-mono text-xs text-muted-foreground">{load.id}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm">
                          {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {load.equipmentType ?? load.equipment_type} &middot; {load.totalMiles ?? load.total_miles ?? 0} mi &middot; {(load.weight ?? 0).toLocaleString()} lbs &middot;{" "}
                          <span className="text-primary font-mono font-bold">${(load.payRate ?? load.pay_rate ?? 0).toLocaleString()}</span>
                        </p>
                        {(load.pickup_date ?? load.pickupDate) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            📅 Pickup: <span className="text-foreground">{load.pickup_date ?? load.pickupDate}</span>
                            {(load.dropoff_date ?? load.dropoffDate) && (
                              <> &middot; Dropoff: <span className="text-foreground">{load.dropoff_date ?? load.dropoffDate}</span></>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {load.status !== "Available" && (
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(load.id, "Available")}
                            className="border-border text-muted-foreground h-8 text-xs">
                            <ToggleLeft className="size-3 mr-1" /> Mark Available
                          </Button>
                        )}
                        {load.status !== "Booked" && load.status !== "Canceled" && (
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(load.id, "Booked")}
                            className="border-border text-muted-foreground h-8 text-xs">
                            <ToggleRight className="size-3 mr-1" /> Mark Booked
                          </Button>
                        )}
                        {load.status !== "Canceled" && (
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(load.id, "Canceled")}
                            className="border-border text-destructive h-8 text-xs">
                            <Trash2 className="size-3 mr-1" /> Cancel Load
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setMessageLoadId(load.id)}
                          className="border-border text-muted-foreground h-8 text-xs">
                          <MessageSquare className="size-3 mr-1" /> Messages
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(load.id)}
                          className="border-border text-destructive h-8 w-8">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {loads.length === 0 && (
                <div className="py-16 text-center">
                  <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-semibold">No loads posted yet</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Requests */}
        <TabsContent value="requests">
          <div className="flex flex-col gap-3">
            {requests.map((req) => (
              <Card key={req.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-[#ffd166]/15 text-[#ffd166] border-0 text-[10px] uppercase font-bold tracking-wider">{req.status}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{req.loadId ?? req.load_id}</span>
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{req.type ?? req.requester_type}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {req.driverName ?? req.driver_name} &middot; {req.companyName ?? req.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {req.mc ?? req.mc_number} &middot; {req.truckType ?? req.truck_type} #{req.truckNumber ?? req.truck_number} &middot; Currently: {req.currentLocation ?? req.truck_location}
                      </p>
                      {(req.counterOfferPrice ?? req.counter_offer) && (
                        <p className="text-xs text-[#ffd166] font-mono mt-1">Counter Offer: ${(req.counterOfferPrice ?? req.counter_offer ?? 0).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status === "pending" ? (
                        <>
                          <Button size="sm" onClick={() => handleAcceptRequest(req.id)} className="bg-primary text-primary-foreground h-8 text-xs font-bold">Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeclineRequest(req.id)} className="border-border text-muted-foreground h-8 text-xs">Decline</Button>
                        </>
                      ) : (
                        <Badge className={cn("border-0 text-[10px] font-bold uppercase", req.status === "accepted" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>{req.status}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {requests.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-muted-foreground font-semibold">No requests yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              {loads.length === 0 && <p className="text-xs text-muted-foreground p-2">No loads yet</p>}
              {loads.map((load) => {
                const loadMsgs = messages.filter((m) => (m.loadId ?? m.load_id) === load.id)
                const unread = loadMsgs.filter((m) => !m.read && (m.senderRole ?? m.sender_role) !== "broker").length
                const lastMsg = loadMsgs[loadMsgs.length - 1]
                return (
                  <button
                    key={load.id}
                    onClick={() => setMessageLoadId(load.id)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-colors",
                      messageLoadId === load.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{load.id}</span>
                      {unread > 0 && (
                        <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {load.pickupCity ?? load.pickup_city} → {load.dropoffCity ?? load.dropoff_city}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {lastMsg ? lastMsg.content?.slice(0, 40) + "..." : "No messages yet"}
                    </p>
                  </button>
                )
              })}
            </div>
            <div className="lg:col-span-2 border border-border rounded-lg bg-card min-h-96">
              {messageLoadId ? (
                <MessageThread
                  messages={messages.filter((m) => (m.loadId ?? m.load_id) === messageLoadId)}
                  currentUserId={currentUser?.id ?? "USR-002"}
                  currentUserName={brokerName}
                  currentUserRole="broker"
                  load={loads.find((l) => l.id === messageLoadId)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Select a load to view or start a conversation
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Post Load Dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-bold">Post a New Load</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostLoad} className="flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Pickup Location</Label>
                <CityAutocomplete
                  value={formData.pickupLocation}
                  onChange={handlePickupSelect}
                  placeholder="City, State"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Dropoff Location</Label>
                <CityAutocomplete
                  value={formData.dropoffLocation}
                  onChange={handleDropoffSelect}
                  placeholder="City, State"
                  required
                />
              </div>
            </div>

            {(formData.totalMiles || calculatingMiles) && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                style={{ background: "rgba(42,223,10,0.06)", border: "1px solid rgba(42,223,10,0.15)" }}
              >
                {calculatingMiles ? (
                  <span className="text-muted-foreground">Calculating route distance...</span>
                ) : (
                  <>
                    <span style={{ color: "#2adf0a" }}>📍</span>
                    <span className="text-foreground font-bold">{formData.totalMiles} miles</span>
                    <span className="text-muted-foreground">— calculated via HERE Maps</span>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Equipment Type</Label>
                <Select value={formData.equipmentType} onValueChange={(v) => setFormData((p) => ({ ...p, equipmentType: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {equipmentTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Load Type</Label>
                <Select value={formData.loadType} onValueChange={(v) => setFormData((p) => ({ ...p, loadType: v }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="FTL or LTL" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {loadTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Pickup Date</Label>
                <Input className="bg-input border-border text-foreground" type="date" required value={formData.pickupDate} onChange={(e) => setFormData((p) => ({ ...p, pickupDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Dropoff Date</Label>
                <Input className="bg-input border-border text-foreground" type="date" value={formData.dropoffDate} onChange={(e) => setFormData((p) => ({ ...p, dropoffDate: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Weight (lbs)</Label>
                <Input className="bg-input border-border text-foreground font-mono" type="number" placeholder="0" required value={formData.weight} onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Pay Rate ($)</Label>
                <Input className="bg-input border-border text-foreground font-mono" type="number" placeholder="0.00" required value={formData.payRate} onChange={(e) => setFormData((p) => ({ ...p, payRate: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Load Details</Label>
              <Textarea className="bg-input border-border text-foreground min-h-20" placeholder="Describe the load..." required value={formData.details} onChange={(e) => setFormData((p) => ({ ...p, details: e.target.value }))} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Broker MC#</Label>
              <Input className="bg-input border-border text-foreground font-mono" value={brokerMC} readOnly />
            </div>

            <Button type="submit" className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2">
              Post Load
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}