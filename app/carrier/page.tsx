"use client"

import { useState, useEffect } from "react"
import { MessageThread } from "@/components/message-thread"
import { cn } from "@/lib/utils"
import { Package, DollarSign, Truck, MapPin, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-nav"
import { LoadCard } from "@/components/load-card"
import { RequestLoadModal } from "@/components/request-load-modal"
import { CityAutocomplete } from "@/components/city-autocomplete"
import {
  useLoads, useLoadRequests, useMessages,
  usePostedTrucks, createPostedTruck, deletePostedTruck,
} from "@/hooks/use-api"
import type { Load } from "@/lib/mock-data"

const equipmentTypes = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

export default function CarrierDashboard() {
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messageLoadId, setMessageLoadId] = useState<string | null>(null)
  const [postTruckOpen, setPostTruckOpen] = useState(false)
  const [truckSubmitted, setTruckSubmitted] = useState(false)
  const [truckForm, setTruckForm] = useState({
    driver_name: "",
    phone: "",
    email: "",
    mc_number: "",
    equipment_type: "",
    max_weight: "",
    current_location: "",
    available_date: "",
    available_time: "",
    notes: "",
  })

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) {
      const user = JSON.parse(stored)
      setCurrentUser(user)
      setTruckForm((p) => ({
        ...p,
        mc_number: user.mc ?? user.broker_mc ?? "",
        email: user.email ?? "",
      }))
    }
  }, [])

  const { data: allLoads = [] } = useLoads()
  const { data: allRequests = [] } = useLoadRequests()
  const { data: myTrucks = [] } = usePostedTrucks({ postedById: currentUser?.id })

  const availableLoads = allLoads.filter((l) => l.status === "Available")

  const myRequests = allRequests.filter((r) =>
    (r.mc_number ?? r.mc) === (currentUser?.mc ?? currentUser?.mc_number ?? "")
    || r.requester_type === "carrier" || r.type === "carrier"
  )

  const myBookedLoadIds = new Set(
    myRequests.filter((r) => r.status === "accepted").map((r) => r.load_id ?? r.loadId)
  )
  const myBookedLoads = allLoads.filter((l) => myBookedLoadIds.has(l.id))

  const { data: allMessages = [] } = useMessages()
  const myMessages = allMessages.filter((m) =>
    myBookedLoadIds.has((m.load_id ?? m.loadId) as string) ||
    myRequests.some((r) => (r.load_id ?? r.loadId) === (m.load_id ?? m.loadId)) ||
    myTrucks.some((t) => t.hired_load_id === (m.load_id ?? m.loadId))
  )

  const getLoadForRequest = (req: any) => {
    const loadId = req.load_id ?? req.loadId
    return allLoads.find((l) => l.id === loadId)
  }

  const handleRequestLoad = (load: Load) => {
    setSelectedLoad(load)
    setModalOpen(true)
  }

  const handlePostTruck = async (e: React.FormEvent) => {
    e.preventDefault()
    await createPostedTruck({
      ...truckForm,
      max_weight: Number(truckForm.max_weight) || 0,
      posted_by_id: currentUser?.id,
      posted_by_role: "carrier",
      status: "available",
    })
    setTruckSubmitted(true)
    setTimeout(() => {
      setTruckSubmitted(false)
      setTruckForm({
        driver_name: "", phone: "", email: currentUser?.email ?? "",
        mc_number: currentUser?.mc ?? currentUser?.broker_mc ?? "",
        equipment_type: "", max_weight: "", current_location: "",
        available_date: "", available_time: "", notes: "",
      })
      setPostTruckOpen(false)
    }, 2000)
  }

  const totalEarnings = myBookedLoads.reduce((s, l) => s + (l.payRate ?? l.pay_rate ?? 0), 0)
  const totalMiles = myBookedLoads.reduce((s, l) => s + (l.totalMiles ?? l.total_miles ?? 0), 0)

  const companyName = currentUser?.company || "Elite Carriers LLC"
  const mcNumber = currentUser?.mc ?? currentUser?.broker_mc ?? "MC-889922"

  return (
    <DashboardShell role="carrier">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Carrier Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{companyName} &middot; {mcNumber}</p>
        </div>
        <Button onClick={() => setPostTruckOpen(true)} className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90">
          <Plus className="size-4 mr-2" /> Post Truck
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{availableLoads.length}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-accent flex items-center justify-center">
              <Truck className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{myBookedLoads.length}</p>
              <p className="text-sm text-muted-foreground">My Booked</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">${totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Earnings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-accent flex items-center justify-center">
              <MapPin className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{totalMiles.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Miles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="loadboard" className="space-y-4">
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
          <TabsList className="bg-card border border-border w-max lg:w-auto">
            <TabsTrigger value="loadboard" className="!text-base">Load Board</TabsTrigger>
            <TabsTrigger value="requests" className="!text-base">
              My Requests
              {myRequests.length > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{myRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="booked" className="!text-base">My Booked Loads</TabsTrigger>
            <TabsTrigger value="mytrucks" className="!text-base">
              My Trucks
              {myTrucks.length > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{myTrucks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="!text-base">
              Messages
              {myMessages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "carrier").length > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                  {myMessages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "carrier").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="loadboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableLoads.map((load) => (
              <LoadCard key={load.id} load={load} onRequestLoad={handleRequestLoad} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="flex flex-col gap-3">
            {myRequests.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-semibold">No requests submitted yet</p>
                <p className="text-sm text-muted-foreground mt-1">Browse the load board and request a load</p>
              </div>
            ) : (
              myRequests.map((req) => {
                const load = getLoadForRequest(req)
                return (
                  <Card key={req.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              req.status === "accepted"
                                ? "bg-primary/15 text-primary border-0 text-[11px] font-bold uppercase"
                                : req.status === "declined" || req.status === "rejected"
                                ? "bg-destructive/15 text-destructive border-0 text-[11px] font-bold uppercase"
                                : "bg-[#ffd166]/15 text-[#ffd166] border-0 text-[11px] font-bold uppercase"
                            }>
                              {req.status}
                            </Badge>
                            <span className="font-mono text-sm text-muted-foreground">
                              {req.load_id ?? req.loadId}
                            </span>
                          </div>
                          {load && (
                            <p className="font-bold text-foreground text-base mb-1">
                              {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                            </p>
                          )}
                          <p className="text-base text-foreground font-medium">
                            {req.company_name ?? req.companyName} &middot; {req.driver_name ?? req.driverName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {req.truck_type ?? req.truckType} &middot; #{req.truck_number ?? req.truckNumber}
                          </p>
                          {load && (load.pickup_date ?? load.pickupDate) && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              📅 Pickup: <span className="text-foreground font-medium">{load.pickup_date ?? load.pickupDate}</span>
                              {(load.dropoff_date ?? load.dropoffDate) && (
                                <> &middot; Dropoff: <span className="text-foreground font-medium">{load.dropoff_date ?? load.dropoffDate}</span></>
                              )}
                            </p>
                          )}
                          {(req.counter_offer ?? req.counterOfferPrice) && (
                            <p className="text-sm text-[#ffd166] font-mono mt-1">
                              Counter Offer: ${(req.counter_offer ?? req.counterOfferPrice ?? 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {req.status === "accepted" && (
                          <Badge className="bg-primary/15 text-primary border-0 text-sm font-bold">✓ Accepted</Badge>
                        )}
                        {(req.status === "declined" || req.status === "rejected") && (
                          <Badge className="bg-destructive/15 text-destructive border-0 text-sm font-bold">✗ Declined</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="booked">
          {myBookedLoads.length > 0 ? (
            <div className="flex flex-col gap-3">
              {myBookedLoads.map((load) => (
                <Card key={load.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-primary/15 text-primary border-0 text-[11px] font-bold uppercase tracking-wider">Booked</Badge>
                          <span className="font-mono text-sm text-muted-foreground">{load.id}</span>
                        </div>
                        <p className="font-bold text-foreground text-base">
                          {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                        </p>
                        <p className="text-sm text-foreground font-medium mt-1">
                          {load.equipmentType ?? load.equipment_type} &middot; {(load.totalMiles ?? load.total_miles ?? 0)} mi &middot; {(load.weight ?? 0).toLocaleString()} lbs &middot;{" "}
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
                      <Badge className="bg-primary/15 text-primary border-0 text-sm font-bold self-start">
                        {load.brokerName ?? load.broker_name}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-semibold">No booked loads yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your accepted load requests will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mytrucks">
          <div className="flex flex-col gap-3">
            {myTrucks.length === 0 ? (
              <div className="py-16 text-center">
                <Truck className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-semibold">No trucks posted yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click Post Truck to make your truck visible to brokers</p>
              </div>
            ) : (
              myTrucks.map((truck) => (
                <Card key={truck.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cn(
                            "border-0 text-[11px] font-bold uppercase tracking-wider",
                            truck.status === "available" ? "bg-primary/15 text-primary"
                            : truck.status === "hired" ? "bg-muted text-muted-foreground"
                            : "bg-[#ffd166]/15 text-[#ffd166]"
                          )}>
                            {truck.status}
                          </Badge>
                          <span className="text-sm font-mono text-muted-foreground">{truck.id}</span>
                        </div>
                        <p className="font-bold text-foreground text-base">{truck.driver_name}</p>
                        <p className="text-sm text-foreground font-medium">
                          {truck.equipment_type} &middot; Max {Number(truck.max_weight).toLocaleString()} lbs
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          MC: <span className="font-mono text-foreground">{truck.mc_number}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          📍 <span className="text-foreground">{truck.current_location}</span>
                        </p>
                        {truck.available_date && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            📅 Available: <span className="text-foreground">{truck.available_date}</span>
                            {truck.available_time && <> at <span className="text-foreground">{truck.available_time}</span></>}
                          </p>
                        )}
                        {truck.status === "hired" && truck.hired_load_id && (
                          <p className="text-sm text-primary font-mono mt-1">✓ Hired for {truck.hired_load_id}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deletePostedTruck(truck.id)}
                        className="border-border text-destructive h-8 w-8 shrink-0"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              {myRequests.length === 0 && myTrucks.filter(t => t.hired_load_id).length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No active loads to message about</p>
              )}
              {myRequests.map((req) => {
                const loadId = req.load_id ?? req.loadId
                const load = allLoads.find((l) => l.id === loadId)
                const loadMsgs = myMessages.filter((m) => (m.load_id ?? m.loadId) === loadId)
                const unread = loadMsgs.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "carrier").length
                const lastMsg = loadMsgs[loadMsgs.length - 1]
                return (
                  <button
                    key={req.id}
                    onClick={() => setMessageLoadId(loadId as string)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-colors",
                      messageLoadId === loadId ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{loadId}</span>
                      {unread > 0 && (
                        <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {load ? `${load.pickupCity ?? load.pickup_city} → ${load.dropoffCity ?? load.dropoff_city}` : loadId}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {lastMsg ? lastMsg.content?.slice(0, 40) + "..." : "No messages yet — click to start"}
                    </p>
                  </button>
                )
              })}
              {myTrucks.filter(t => t.hired_load_id).map((truck) => {
                const loadId = truck.hired_load_id
                const load = allLoads.find((l) => l.id === loadId)
                const loadMsgs = myMessages.filter((m) => (m.load_id ?? m.loadId) === loadId)
                const unread = loadMsgs.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "carrier").length
                const lastMsg = loadMsgs[loadMsgs.length - 1]
                return (
                  <button
                    key={truck.id}
                    onClick={() => setMessageLoadId(loadId)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-colors",
                      messageLoadId === loadId ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{loadId}</span>
                      {unread > 0 && (
                        <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      🚛 Hired — {load ? `${load.pickup_city} → ${load.dropoff_city}` : loadId}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {lastMsg ? lastMsg.content?.slice(0, 40) + "..." : "No messages yet"}
                    </p>
                  </button>
                )
              })}
            </div>
            <div className="lg:col-span-2 border border-border rounded-lg bg-card min-h-[400px]">
                {messageLoadId ? (
                  <MessageThread
                    messages={myMessages.filter((m) => (m.load_id ?? m.loadId) === messageLoadId)}
                    currentUserId={currentUser?.id ?? "USR-003"}
                    currentUserName={companyName}
                    currentUserRole="carrier"
                    load={
                      allLoads.find((l) => l.id === messageLoadId) ??
                      (() => {
                        const truck = myTrucks.find((t) => t.hired_load_id === messageLoadId)
                        if (!truck) return undefined
                        const hireMsg = myMessages.find(
                          (m) => (m.load_id ?? m.loadId) === messageLoadId &&
                          (m.content ?? "").startsWith("__TRUCKHIRE__")
                        )
                        if (!hireMsg) return undefined
                        try {
                          const hire = JSON.parse((hireMsg.content ?? "").replace("__TRUCKHIRE__", ""))
                          return {
                            id: hire.load_id,
                            pickup_city: hire.pickup_city,
                            pickup_state: hire.pickup_state,
                            dropoff_city: hire.dropoff_city,
                            dropoff_state: hire.dropoff_state,
                            pickup_date: hire.pickup_date,
                            dropoff_date: hire.dropoff_date,
                            equipment_type: hire.equipment_type,
                            weight: hire.weight,
                            pay_rate: hire.pay_rate,
                            broker_name: hire.broker_name,
                            broker_mc: hire.broker_mc,
                          }
                        } catch { return undefined }
                      })()
                    }
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Select a load to view messages
                  </div>
                )}
              </div>
              </div>
        </TabsContent>
      </Tabs>

      {/* Post Truck Dialog */}
      <Dialog open={postTruckOpen} onOpenChange={setPostTruckOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-bold">Post Available Truck</DialogTitle>
          </DialogHeader>
          {truckSubmitted ? (
            <div className="py-8 text-center">
              <Truck className="size-10 text-primary mx-auto mb-3" />
              <p className="text-foreground font-semibold">Truck Posted!</p>
              <p className="text-sm text-muted-foreground mt-1">Brokers can now see your truck and hire you for loads.</p>
            </div>
          ) : (
            <form onSubmit={handlePostTruck} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Driver Full Name</Label>
                  <Input className="bg-input border-border text-foreground" placeholder="Full name" required
                    value={truckForm.driver_name} onChange={(e) => setTruckForm((p) => ({ ...p, driver_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Phone Number</Label>
                  <Input className="bg-input border-border text-foreground" placeholder="555-000-0000" required
                    value={truckForm.phone} onChange={(e) => setTruckForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Email</Label>
                  <Input className="bg-input border-border text-foreground" type="email" placeholder="email@company.com" required
                    value={truckForm.email} onChange={(e) => setTruckForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">MC Number</Label>
                  <Input className="bg-input border-border text-foreground font-mono" placeholder="MC-000000" required
                    value={truckForm.mc_number} onChange={(e) => setTruckForm((p) => ({ ...p, mc_number: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Equipment Type</Label>
                  <Select value={truckForm.equipment_type} onValueChange={(v) => setTruckForm((p) => ({ ...p, equipment_type: v }))}>
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
                  <Label className="text-xs text-muted-foreground mb-1.5">Max Weight (lbs)</Label>
                  <Input className="bg-input border-border text-foreground font-mono" type="number" placeholder="0" required
                    value={truckForm.max_weight} onChange={(e) => setTruckForm((p) => ({ ...p, max_weight: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Current Location</Label>
                <CityAutocomplete
                  value={truckForm.current_location}
                  onChange={(label) => setTruckForm((p) => ({ ...p, current_location: label }))}
                  placeholder="City, State"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Available Date</Label>
                  <Input className="bg-input border-border text-foreground" type="date" required
                    value={truckForm.available_date} onChange={(e) => setTruckForm((p) => ({ ...p, available_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Available Time</Label>
                  <Input className="bg-input border-border text-foreground" type="time"
                    value={truckForm.available_time} onChange={(e) => setTruckForm((p) => ({ ...p, available_time: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Notes (optional)</Label>
                <Textarea className="bg-input border-border text-foreground min-h-16" placeholder="Any special notes about the truck or driver..."
                  value={truckForm.notes} onChange={(e) => setTruckForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <Button type="submit" className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2">
                Post Truck
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <RequestLoadModal open={modalOpen} onClose={() => setModalOpen(false)} load={selectedLoad} />
    </DashboardShell>
  )
}