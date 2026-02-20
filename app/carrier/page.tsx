"use client"

import { useState, useEffect } from "react"
import { MessageThread } from "@/components/message-thread"
import { cn } from "@/lib/utils"
import { Package, DollarSign, Truck, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-nav"
import { LoadCard } from "@/components/load-card"
import { RequestLoadModal } from "@/components/request-load-modal"
import { useLoads, useLoadRequests, useMessages } from "@/hooks/use-api"
import type { Load } from "@/lib/mock-data"

export default function CarrierDashboard() {
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messageLoadId, setMessageLoadId] = useState<string | null>(null)
  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) setCurrentUser(JSON.parse(stored))
  }, [])

  const { data: allLoads = [] } = useLoads()
  const { data: allRequests = [] } = useLoadRequests()

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
  myRequests.some((r) => (r.load_id ?? r.loadId) === (m.load_id ?? m.loadId))
)
  const getLoadForRequest = (req: any) => {
    const loadId = req.load_id ?? req.loadId
    return allLoads.find((l) => l.id === loadId)
  }

  const handleRequestLoad = (load: Load) => {
    setSelectedLoad(load)
    setModalOpen(true)
  }

  const totalEarnings = myBookedLoads.reduce((s, l) => s + (l.payRate ?? l.pay_rate ?? 0), 0)
  const totalMiles = myBookedLoads.reduce((s, l) => s + (l.totalMiles ?? l.total_miles ?? 0), 0)

  const companyName = currentUser?.company || "Elite Carriers LLC"
  const mcNumber = currentUser?.mc ?? currentUser?.broker_mc ?? "MC-889922"

  return (
    <DashboardShell role="carrier">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Carrier Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{companyName} &middot; {mcNumber}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{availableLoads.length}</p>
              <p className="text-xs text-muted-foreground">Available</p>
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
              <p className="text-xs text-muted-foreground">My Booked</p>
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
              <p className="text-xs text-muted-foreground">Earnings</p>
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
              <p className="text-xs text-muted-foreground">Total Miles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="loadboard" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="loadboard">Load Board</TabsTrigger>
          <TabsTrigger value="requests">
            My Requests
            {myRequests.length > 0 && (
              <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{myRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="booked">My Booked Loads</TabsTrigger>
          <TabsTrigger value="messages">
              Messages
              {myMessages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "carrier").length > 0 && (
                <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                  {myMessages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "carrier").length}
                </Badge>
              )}
            </TabsTrigger>
        </TabsList>

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
                                ? "bg-primary/15 text-primary border-0 text-[10px] font-bold uppercase"
                                : req.status === "declined" || req.status === "rejected"
                                ? "bg-destructive/15 text-destructive border-0 text-[10px] font-bold uppercase"
                                : "bg-[#ffd166]/15 text-[#ffd166] border-0 text-[10px] font-bold uppercase"
                            }>
                              {req.status}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">
                              {req.load_id ?? req.loadId}
                            </span>
                          </div>
                          {load && (
                            <p className="font-semibold text-foreground text-sm mb-1">
                              {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                            </p>
                          )}
                          <p className="text-sm text-foreground">
                            {req.company_name ?? req.companyName} &middot; {req.driver_name ?? req.driverName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {req.truck_type ?? req.truckType} &middot; #{req.truck_number ?? req.truckNumber}
                          </p>
                          {load && (load.pickup_date ?? load.pickupDate) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              📅 Pickup: <span className="text-foreground">{load.pickup_date ?? load.pickupDate}</span>
                              {(load.dropoff_date ?? load.dropoffDate) && (
                                <> &middot; Dropoff: <span className="text-foreground">{load.dropoff_date ?? load.dropoffDate}</span></>
                              )}
                            </p>
                          )}
                          {(req.counter_offer ?? req.counterOfferPrice) && (
                            <p className="text-xs text-[#ffd166] font-mono mt-1">
                              Counter Offer: ${(req.counter_offer ?? req.counterOfferPrice ?? 0).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {req.status === "accepted" && (
                          <Badge className="bg-primary/15 text-primary border-0 text-xs font-bold">✓ Accepted</Badge>
                        )}
                        {(req.status === "declined" || req.status === "rejected") && (
                          <Badge className="bg-destructive/15 text-destructive border-0 text-xs font-bold">✗ Declined</Badge>
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
                          <Badge className="bg-primary/15 text-primary border-0 text-[10px] font-bold uppercase tracking-wider">
                            Booked
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{load.id}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm">
                          {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {load.equipmentType ?? load.equipment_type} &middot; {(load.totalMiles ?? load.total_miles ?? 0)} mi &middot; {(load.weight ?? 0).toLocaleString()} lbs &middot;{" "}
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
                      <Badge className="bg-primary/15 text-primary border-0 text-xs font-bold self-start">
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
        <TabsContent value="messages">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="flex flex-col gap-2">
      {myRequests.length === 0 && (
        <p className="text-xs text-muted-foreground p-2">No active loads to message about</p>
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
              messageLoadId === loadId
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-muted-foreground">{loadId}</span>
              {unread > 0 && (
                <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground truncate">
              {load ? `${load.pickupCity ?? load.pickup_city} → ${load.dropoffCity ?? load.dropoff_city}` : loadId}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {lastMsg ? lastMsg.content?.slice(0, 40) + "..." : "No messages yet — click to start"}
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
          load={allLoads.find((l) => l.id === messageLoadId)}
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

      <RequestLoadModal open={modalOpen} onClose={() => setModalOpen(false)} load={selectedLoad} />
    </DashboardShell>
  )
}