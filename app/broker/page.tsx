"use client"

import { useState, useEffect } from "react"
import {
  Package, Plus, DollarSign, CheckCircle,
  Clock, Trash2, ToggleLeft, ToggleRight, Truck,
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
  useLoads, useLoadRequests, useMessages, usePostedTrucks, updatePostedTruck,
  createLoad, updateLoad, deleteLoadApi, updateLoadRequest,
} from "@/hooks/use-api"
import type { EquipmentType, LoadStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]
const loadTypes = ["FTL", "LTL"]

export default function BrokerDashboard() {
  const [postOpen, setPostOpen] = useState(false)
  const [messageLoadId, setMessageLoadId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("loads")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [calculatingMiles, setCalculatingMiles] = useState(false)
  const [requestMiles, setRequestMiles] = useState<Record<string, number | null>>({})
  const [truckMiles, setTruckMiles] = useState<Record<string, number | null>>({})
  const [hireDialogOpen, setHireDialogOpen] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState<any>(null)
  const [selectedLoadForHire, setSelectedLoadForHire] = useState<string>("")
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
  const { data: availableTrucks = [] } = usePostedTrucks({ status: "available" })

  const brokerLoadIds = new Set(loads.map((l) => l.id))
  const requests = allRequests.filter((r) => brokerLoadIds.has((r.loadId ?? r.load_id) as string))
  const messages = allMessages.filter((m) => brokerLoadIds.has((m.loadId ?? m.load_id) as string))

  const unreadCount = messages.filter((m) => !m.read && m.sender_id !== currentUser?.id).length
  const available = loads.filter((l) => l.status === "Available").length
  const booked = loads.filter((l) => l.status === "Booked").length
  const totalRevenue = loads.reduce((s, l) => s + (l.payRate ?? l.pay_rate ?? 0), 0)

  useEffect(() => {
    if (availableTrucks.length === 0) return
    availableTrucks.forEach(async (truck) => {
      if (!truck.current_location || truckMiles[truck.id] !== undefined) return
      const availableLoad = loads.find((l) => l.status === "Available")
      if (!availableLoad) return
      const pickup = `${availableLoad.pickup_city}, ${availableLoad.pickup_state}`
      try {
        const res = await fetch(
          `/api/here/distance?origin=${encodeURIComponent(truck.current_location)}&destination=${encodeURIComponent(pickup)}`,
          { headers: { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" } }
        )
        const data = await res.json()
        if (data.miles) setTruckMiles((prev) => ({ ...prev, [truck.id]: data.miles }))
      } catch {
        setTruckMiles((prev) => ({ ...prev, [truck.id]: null }))
      }
    })
  }, [availableTrucks, loads])

  useEffect(() => {
    if (requests.length === 0) return
    requests.forEach(async (req) => {
      const load = loads.find((l) => l.id === (req.load_id ?? req.loadId))
      const truckLocation = req.truck_location ?? req.currentLocation
      const pickupCity = load?.pickup_city
      const pickupState = load?.pickup_state
      if (!truckLocation || !pickupCity || requestMiles[req.id] !== undefined) return
      try {
        const pickup = `${pickupCity}, ${pickupState}`
        const res = await fetch(
          `/api/here/distance?origin=${encodeURIComponent(truckLocation)}&destination=${encodeURIComponent(pickup)}`,
          { headers: { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" } }
        )
        const data = await res.json()
        if (data.miles) setRequestMiles((prev) => ({ ...prev, [req.id]: data.miles }))
      } catch {
        setRequestMiles((prev) => ({ ...prev, [req.id]: null }))
      }
    })
  }, [requests, loads])

  async function calculateMiles(pickup: string, dropoff: string) {
    if (!pickup || !dropoff) return
    setCalculatingMiles(true)
    try {
      const res = await fetch(
        `/api/here/distance?origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`,
        { headers: { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" } }
      )
      const data = await res.json()
      if (data.miles) setFormData((p) => ({ ...p, totalMiles: String(data.miles) }))
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
    await updateLoadRequest(reqId, { status: "declined" })
    const req = requests.find((r) => r.id === reqId)
    const loadId = req?.load_id ?? req?.loadId
    if (loadId) await updateLoad(loadId, { status: "Available" })
  }

  const handleHireTruck = async () => {
    if (!selectedTruck || !selectedLoadForHire) return
    const load = loads.find((l) => l.id === selectedLoadForHire)
    if (!load) return

    try {
      // 1. Update truck status to hired
      await updatePostedTruck(selectedTruck.id, {
        status: "hired",
        hired_by_broker_id: brokerId,
        hired_load_id: selectedLoadForHire,
      })

      // 2. Create a load_request record so both sides share a message thread
      await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          load_id: selectedLoadForHire,
          requester_id: selectedTruck.posted_by_id,
          requester_type: selectedTruck.posted_by_role,
          driver_name: selectedTruck.driver_name,
          company_name: selectedTruck.mc_number,
          mc_number: selectedTruck.mc_number,
          truck_type: selectedTruck.equipment_type,
          truck_number: selectedTruck.id,
          truck_location: selectedTruck.current_location,
          phone: selectedTruck.phone,
          requester_email: selectedTruck.email,
          status: "accepted",
        }),
      })

      // 3. Send the __TRUCKHIRE__ message to the shared thread
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          load_id: selectedLoadForHire,
          sender_id: brokerId,
          sender_name: brokerName,
          sender_role: "broker",
          content: `__TRUCKHIRE__${JSON.stringify({
            truck_id: selectedTruck.id,
            driver_name: selectedTruck.driver_name,
            broker_name: brokerName,
            broker_mc: brokerMC,
            load_id: load.id,
            pickup_city: load.pickup_city,
            pickup_state: load.pickup_state,
            dropoff_city: load.dropoff_city,
            dropoff_state: load.dropoff_state,
            pickup_date: load.pickup_date,
            dropoff_date: load.dropoff_date,
            pay_rate: load.pay_rate,
            weight: load.weight,
            equipment_type: load.equipment_type,
            details: load.details,
            posted_by_id: selectedTruck.posted_by_id,
          })}`,
          message_type: "truck_hire",
          recipient_id: selectedTruck.posted_by_id,
        }),
      })

      setHireDialogOpen(false)
      setSelectedTruck(null)
      setSelectedLoadForHire("")
      setActiveTab("messages")
    } catch (err) {
      console.error("Hire truck error:", err)
      alert("Failed to hire truck. Please try again.")
    }
  }

  const handlePostLoad = async (e: React.FormEvent) => {
    e.preventDefault()
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

    let pickup_lat = null, pickup_lng = null, dropoff_lat = null, dropoff_lng = null
    try {
      const [pickupGeo, dropoffGeo] = await Promise.all([
        fetch(`/api/here/geocode?city=${encodeURIComponent(`${pickup.city}, ${pickup.state}`)}`, {
          headers: { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" }
        }).then(r => r.json()),
        fetch(`/api/here/geocode?city=${encodeURIComponent(`${dropoff.city}, ${dropoff.state}`)}`, {
          headers: { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" }
        }).then(r => r.json()),
      ])
      pickup_lat = pickupGeo.lat ?? null
      pickup_lng = pickupGeo.lng ?? null
      dropoff_lat = dropoffGeo.lat ?? null
      dropoff_lng = dropoffGeo.lng ?? null
    } catch {}

    await createLoad({
      pickup_city: pickup.city, pickup_state: pickup.state,
      dropoff_city: dropoff.city, dropoff_state: dropoff.state,
      pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
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
              <p className="text-sm text-muted-foreground">Total Loads</p>
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
              <p className="text-sm text-muted-foreground">Available</p>
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
              <p className="text-sm text-muted-foreground">Booked</p>
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
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 overflow-hidden">
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
          <TabsList className="bg-card border border-border w-max lg:w-full">
            <TabsTrigger value="loads" className="!text-base">My Loads</TabsTrigger>
            <TabsTrigger value="requests" className="!text-base">
              Requests
              {requests.length > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{requests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trucks" className="!text-base">
              Available Trucks
              {availableTrucks.length > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{availableTrucks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="!text-base">
              Messages
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* My Loads */}
        <TabsContent value="loads">
          {isLoading ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">Loading loads...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">💬 Click a load to view or start a conversation</p>
              {loads.map((load) => (
                <Card
                  key={load.id}
                  className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => { setMessageLoadId(load.id); setActiveTab("messages") }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={cn(
                            "text-[11px] font-bold uppercase tracking-wider border-0",
                            load.status === "Available" ? "bg-primary/15 text-primary"
                              : load.status === "Canceled" ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {load.status}
                          </Badge>
                          {(load.load_type ?? (load as any).loadType) && (
                            <Badge className="text-[11px] font-bold uppercase tracking-wider border-0 bg-blue-500/15 text-blue-400">
                              {load.load_type ?? (load as any).loadType}
                            </Badge>
                          )}
                          <span className="font-mono text-sm text-muted-foreground">{load.id}</span>
                        </div>
                        <p className="font-bold text-foreground text-base">
                          {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                        </p>
                        <p className="text-sm text-foreground font-medium mt-1">
                          {load.equipmentType ?? load.equipment_type} &middot; {load.totalMiles ?? load.total_miles ?? 0} mi &middot; {(load.weight ?? 0).toLocaleString()} lbs &middot;{" "}
                          <span className="text-primary font-mono font-bold">${(load.payRate ?? load.pay_rate ?? 0).toLocaleString()}</span>
                        </p>
                        {(load.pickup_date ?? load.pickupDate) && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            📅 Pickup: <span className="text-foreground font-medium">{load.pickup_date ?? load.pickupDate}</span>
                            {(load.dropoff_date ?? load.dropoffDate) && (
                              <> &middot; Dropoff: <span className="text-foreground font-medium">{load.dropoff_date ?? load.dropoffDate}</span></>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {load.status !== "Available" && (
                          <Button variant="outline" size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleStatus(load.id, "Available") }}
                            className="border-border text-muted-foreground h-8 text-sm">
                            <ToggleLeft className="size-3 mr-1" /> Mark Available
                          </Button>
                        )}
                        {load.status !== "Booked" && load.status !== "Canceled" && (
                          <Button variant="outline" size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleStatus(load.id, "Booked") }}
                            className="border-border text-muted-foreground h-8 text-sm">
                            <ToggleRight className="size-3 mr-1" /> Mark Booked
                          </Button>
                        )}
                        {load.status !== "Canceled" && (
                          <Button variant="outline" size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleStatus(load.id, "Canceled") }}
                            className="border-border text-destructive h-8 text-sm">
                            <Trash2 className="size-3 mr-1" /> Cancel Load
                          </Button>
                        )}
                        <Button variant="outline" size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDelete(load.id) }}
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
            {requests.map((req) => {
              const load = loads.find((l) => l.id === (req.load_id ?? req.loadId))
              const milesAway = requestMiles[req.id]
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
                          {(req.truck_number ?? req.truckNumber) && <> &middot; Truck #{req.truck_number ?? req.truckNumber}</>}
                        </p>
                        {(req.truck_location ?? req.currentLocation) && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            📍 Currently: <span className="text-foreground">{req.truck_location ?? req.currentLocation}</span>
                            {milesAway !== undefined && milesAway !== null && (
                              <span className="ml-1 text-primary font-mono font-semibold">— {milesAway} mi from pickup</span>
                            )}
                          </p>
                        )}
                        {load && (load.pickup_date ?? load.pickupDate) && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            📅 Pickup: <span className="text-foreground font-medium">{load.pickup_date ?? load.pickupDate}</span>
                            {(load.dropoff_date ?? load.dropoffDate) && (
                              <> &middot; Dropoff: <span className="text-foreground font-medium">{load.dropoff_date ?? load.dropoffDate}</span></>
                            )}
                          </p>
                        )}
                        {load && (
                          <p className="text-sm text-foreground font-medium mt-0.5">
                            {load.equipment_type} &middot; {load.total_miles ?? 0} mi total &middot;{" "}
                            <span className="text-primary font-mono font-bold">${(load.pay_rate ?? 0).toLocaleString()}</span>
                          </p>
                        )}
                        {(req.counter_offer ?? req.counterOfferPrice) && (
                          <p className="text-sm text-[#ffd166] font-mono mt-1">
                            Counter Offer: ${(req.counter_offer ?? req.counterOfferPrice ?? 0).toLocaleString()}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {req.phone && <>📞 Phone: <span className="text-foreground">{req.phone}</span></>}
                          {req.requester_email && <> &middot; {req.requester_email}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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

        {/* Available Trucks */}
        <TabsContent value="trucks">
          <div className="flex flex-col gap-3">
            {availableTrucks.length === 0 ? (
              <div className="py-16 text-center">
                <Truck className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-semibold">No trucks available right now</p>
                <p className="text-sm text-muted-foreground mt-1">Carriers and dispatchers will post available trucks here</p>
              </div>
            ) : (
              availableTrucks.map((truck) => (
                <Card key={truck.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="bg-primary/15 text-primary border-0 text-[11px] font-bold uppercase tracking-wider">
                            Available
                          </Badge>
                          <span className="text-sm font-mono text-muted-foreground">{truck.id}</span>
                          <Badge variant="outline" className="text-[11px] border-border text-muted-foreground capitalize">
                            {truck.posted_by_role}
                          </Badge>
                        </div>
                        <p className="font-bold text-foreground text-base mb-1">{truck.driver_name}</p>
                        <p className="text-sm text-foreground font-medium">
                          {truck.equipment_type} &middot; Max {Number(truck.max_weight).toLocaleString()} lbs
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          MC: <span className="font-mono text-foreground">{truck.mc_number}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          📍 Currently: <span className="text-foreground">{truck.current_location}</span>
                        </p>
                        {truck.available_date && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            📅 Available: <span className="text-foreground font-medium">{truck.available_date}</span>
                            {truck.available_time && <> at <span className="text-foreground font-medium">{truck.available_time}</span></>}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          📞 <span className="text-foreground">{truck.phone}</span>
                          {truck.email && <> &middot; <span className="text-foreground">{truck.email}</span></>}
                        </p>
                        {truck.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{truck.notes}</p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <Button
                          size="sm"
                          onClick={() => { setSelectedTruck(truck); setHireDialogOpen(true) }}
                          className="bg-primary text-primary-foreground h-8 text-sm font-bold uppercase tracking-wider"
                        >
                          Hire Truck
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              {loads.length === 0 && allRequests.filter(r => brokerLoadIds.has((r.load_id ?? r.loadId) as string) && r.status === "accepted" && r.truck_number).length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No loads yet</p>
              )}

              {/* Regular load threads */}
              {loads.map((load) => {
                const loadMsgs = messages.filter((m) => (m.loadId ?? m.load_id) === load.id)
                const unread = loadMsgs.filter((m) => !m.read && (m.senderRole ?? m.sender_role) !== "broker").length
                const acceptedReq = allRequests.find((r) =>
                  (r.load_id ?? r.loadId) === load.id && r.status === "accepted"
                )
                const contactName = acceptedReq
                  ? (acceptedReq.company_name ?? acceptedReq.companyName ?? acceptedReq.driver_name ?? acceptedReq.driverName)
                  : null
                const lastMsg = loadMsgs[loadMsgs.length - 1]
                const lastMsgPreview = lastMsg
                  ? lastMsg.content?.startsWith("__RATECON__") || lastMsg.content?.startsWith("__TRUCKHIRE__")
                    ? "📋 Load Confirmation sent"
                    : lastMsg.content?.slice(0, 40) + "..."
                  : "No messages yet"

                return (
                  <button
                    key={load.id}
                    onClick={() => setMessageLoadId(load.id)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-colors w-full",
                      messageLoadId === load.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{load.id}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge className={cn(
                          "border-0 text-[10px] font-bold uppercase px-1.5",
                          load.status === "Available" ? "bg-primary/15 text-primary"
                          : load.status === "Booked" ? "bg-blue-500/15 text-blue-400"
                          : "bg-destructive/15 text-destructive"
                        )}>
                          {load.status}
                        </Badge>
                        {unread > 0 && (
                          <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {load.pickup_city}, {load.pickup_state} → {load.dropoff_city}, {load.dropoff_state}
                    </p>
                    {contactName && (
                      <p className="text-xs text-primary font-semibold mt-0.5">👤 {contactName}</p>
                    )}
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {load.pickup_date ? `📅 ${load.pickup_date}` : "No date set"}
                      </p>
                      <p className="text-xs font-mono text-primary font-bold">
                        ${(load.pay_rate ?? load.payRate ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {lastMsgPreview}
                    </p>
                  </button>
                )
              })}

              {/* Hired truck threads */}
              {allRequests
                .filter((r) =>
                  brokerLoadIds.has((r.load_id ?? r.loadId) as string) &&
                  r.status === "accepted" &&
                  r.truck_number
                )
                .map((req) => {
                  const load = loads.find((l) => l.id === (req.load_id ?? req.loadId))
                  if (!load) return null
                  const loadMsgs = messages.filter((m) => (m.loadId ?? m.load_id) === load.id)
                  const unread = loadMsgs.filter((m) => !m.read && (m.senderRole ?? m.sender_role) !== "broker").length
                  const lastMsg = loadMsgs[loadMsgs.length - 1]
                  const lastMsgPreview = lastMsg
                    ? lastMsg.content?.startsWith("__TRUCKHIRE__") ? "🚛 Truck Hired"
                      : lastMsg.content?.startsWith("__RATECON__") ? "📋 Load Confirmation sent"
                      : lastMsg.content?.slice(0, 40) + "..."
                    : "No messages yet"
                  return (
                    <button
                      key={req.id}
                      onClick={() => setMessageLoadId(load.id)}
                      className={cn(
                        "text-left p-3 rounded-lg border transition-colors w-full",
                        messageLoadId === load.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{load.id}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge className="border-0 text-[10px] font-bold uppercase px-1.5 bg-primary/15 text-primary">
                            Hired
                          </Badge>
                          {unread > 0 && (
                            <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        🚛 {load.pickup_city}, {load.pickup_state} → {load.dropoff_city}, {load.dropoff_state}
                      </p>
                      <p className="text-xs text-primary font-semibold mt-0.5">👤 {req.driver_name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {load.pickup_date ? `📅 ${load.pickup_date}` : "No date set"}
                        </p>
                        <p className="text-xs font-mono text-primary font-bold">
                          ${(load.pay_rate ?? load.payRate ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{lastMsgPreview}</p>
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

      {/* Hire Truck Dialog */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-bold">Hire Truck</DialogTitle>
          </DialogHeader>
          {selectedTruck && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-bold text-foreground">{selectedTruck.driver_name}</p>
                <p className="text-sm text-muted-foreground">{selectedTruck.equipment_type} &middot; {selectedTruck.current_location}</p>
                <p className="text-sm text-muted-foreground">📞 {selectedTruck.phone}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5">Select Load to Assign</Label>
                <Select value={selectedLoadForHire} onValueChange={setSelectedLoadForHire}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Choose a load" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {loads.filter((l) => l.status === "Available").map((load) => (
                      <SelectItem key={load.id} value={load.id} className="text-foreground">
                        {load.id} — {load.pickup_city} → {load.dropoff_city} &middot; ${(load.pay_rate ?? load.payRate ?? 0).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                The carrier/dispatcher will be notified with full load details and a message thread will open.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleHireTruck}
                  disabled={!selectedLoadForHire}
                  className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90"
                >
                  Confirm Hire
                </Button>
                <Button variant="outline" onClick={() => setHireDialogOpen(false)}
                  className="border-border text-muted-foreground">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                <CityAutocomplete value={formData.pickupLocation} onChange={handlePickupSelect} placeholder="City, State" required />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Dropoff Location</Label>
                <CityAutocomplete value={formData.dropoffLocation} onChange={handleDropoffSelect} placeholder="City, State" required />
              </div>
            </div>
            {(formData.totalMiles || calculatingMiles) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                style={{ background: "rgba(42,223,10,0.06)", border: "1px solid rgba(42,223,10,0.15)" }}>
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