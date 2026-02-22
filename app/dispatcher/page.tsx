"use client"

import { MessageThread } from "@/components/message-thread"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
  Users, Plus, Mail, CheckCircle, Clock, FileText, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-nav"
import { LoadCard } from "@/components/load-card"
import { RequestLoadModal } from "@/components/request-load-modal"
import { useDrivers, useLoads, useLoadRequests, useMessages } from "@/hooks/use-api"
import type { Load } from "@/lib/mock-data"

export default function DispatcherDashboard() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteSent, setInviteSent] = useState(false)
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messageLoadId, setMessageLoadId] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) setCurrentUser(JSON.parse(stored))
  }, [])

  const { data: drivers = [] } = useDrivers(currentUser?.id ?? undefined)
  const { data: allLoads = [] } = useLoads()
  const { data: allRequests = [] } = useLoadRequests()
  const { data: allMessages = [] } = useMessages()

  const availableLoads = allLoads.filter((l) => l.status === "Available")

  const myRequests = currentUser ? allRequests.filter((r) =>
  (r.requester_type === "dispatcher" || r.type === "dispatcher") &&
  r.dispatcher_name === currentUser.name
) : []

  const myBookedLoadIds = new Set(
    myRequests.filter((r) => r.status === "accepted").map((r) => r.load_id ?? r.loadId)
  )
  const myBookedLoads = allLoads.filter((l) => myBookedLoadIds.has(l.id))

  // Now safe to reference myRequests
  const myMessages = allMessages.filter((m) =>
    myRequests.some((r) => (r.load_id ?? r.loadId) === (m.load_id ?? m.loadId))
  )

  const getLoadForRequest = (req: any) => {
    const loadId = req.load_id ?? req.loadId
    return allLoads.find((l) => l.id === loadId)
  }

 const handleInvite = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        dispatcherId: currentUser?.id,
        dispatcherName: currentUser?.name,
        dispatcherCompany: currentUser?.company,
      }),
    })
    if (!res.ok) throw new Error("Failed to send invite")
    setInviteSent(true)
    setTimeout(() => {
      setInviteSent(false)
      setInviteEmail("")
      setInviteOpen(false)
    }, 2000)
  } catch (err) {
    console.error("Invite error:", err)
    alert("Failed to send invite. Please try again.")
  }
}

  const handleRequestLoad = (load: Load) => {
    setSelectedLoad(load)
    setModalOpen(true)
  }

  const getDocStatus = (driver: any, key: string) => {
    const urlMap: Record<string, string> = {
      mcLetter: driver.mc_letter_url,
      insurance: driver.insurance_url,
      w9: driver.w9_url,
      noa: driver.noa_url,
    }
    const mockVal = driver.documents?.[key]
    const supaVal = urlMap[key]
    if (supaVal) return "uploaded"
    if (mockVal) return mockVal
    return "pending"
  }

  const docIcon = (status: string) => {
    if (status === "uploaded") return <CheckCircle className="size-3.5 text-primary" />
    if (status === "pending") return <Clock className="size-3.5 text-[#ffd166]" />
    return <Clock className="size-3.5 text-muted-foreground opacity-30" />
  }

  const docsComplete = drivers.filter((d: any) => {
    return (
      (d.mc_letter_url || d.documents?.mcLetter === "uploaded") &&
      (d.insurance_url || d.documents?.insurance === "uploaded") &&
      (d.w9_url || d.documents?.w9 === "uploaded")
    )
  }).length

  const docsPending = drivers.filter((d: any) => {
    return (
      (!d.mc_letter_url && d.documents?.mcLetter !== "uploaded") ||
      (!d.insurance_url && d.documents?.insurance !== "uploaded") ||
      (!d.w9_url && d.documents?.w9 !== "uploaded")
    )
  }).length

  const dispatcherName = currentUser?.company || "Apex Dispatch"

  return (
    <DashboardShell role="dispatcher">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Dispatcher Dashboard</h2>
          <p className="text-md text-muted-foreground mt-1">{dispatcherName}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90">
          <Plus className="size-4 mr-2" /> Invite Driver
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{drivers.length}</p>
              <p className="text-md text-muted-foreground">Drivers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{availableLoads.length}</p>
              <p className="text-md text-muted-foreground">Available Loads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{docsComplete}</p>
              <p className="text-md text-muted-foreground">Docs Complete</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#ffd166]/10 flex items-center justify-center">
              <Clock className="size-5 text-[#ffd166]" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{docsPending}</p>
              <p className="text-md text-muted-foreground">Docs Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drivers" className="space-y-4">
  <TabsList className="bg-card border border-border">
    <TabsTrigger value="drivers" className="!text-base">Driver Roster</TabsTrigger>
    <TabsTrigger value="requests" className="!text-base">
      My Requests
      {myRequests.length > 0 && (
        <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{myRequests.length}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="loadboard" className="!text-base">Browse Loads</TabsTrigger>
    <TabsTrigger value="booked" className="!text-base">
      Booked Loads
      {myBookedLoads.length > 0 && (
        <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{myBookedLoads.length}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="messages" className="!text-base">
      Messages
      {myMessages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "dispatcher").length > 0 && (
        <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">
          {myMessages.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "dispatcher").length}
        </Badge>
      )}
    </TabsTrigger>
  </TabsList>

        <TabsContent value="drivers">
          {drivers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-semibold">No drivers yet</p>
              <p className="text-md text-muted-foreground mt-1">Click Invite Driver to add your first driver</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {drivers.map((driver: any) => (
                <Card key={driver.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{driver.name}</h3>
                        <p className="text-sm text-muted-foreground">{driver.company}</p>
                      </div>
                      <Badge className="bg-primary/15 text-primary border-0 text-[10px] font-bold">
                        {driver.equipment_type ?? driver.equipmentType}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 mb-3">
                      <p className="text-sm font-mono text-muted-foreground">MC: {driver.mc_number ?? driver.mc}</p>
                      <p className="text-sm font-mono text-muted-foreground">DOT: {driver.dot_number ?? driver.dot}</p>
                      <p className="text-sm text-muted-foreground">{driver.phone ?? driver.email}</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-[12px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Documents</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: "mcLetter", label: "MC Letter", url: driver.mc_letter_url },
                          { key: "insurance", label: "Insurance", url: driver.insurance_url },
                          { key: "w9", label: "W-9", url: driver.w9_url },
                          { key: "noa", label: "NOA", url: driver.noa_url },
                        ].map(({ key, label, url }) => (
                                            <div key={key} className="flex items-center gap-1.5">
                        {docIcon(getDocStatus(driver, key))}
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[13px] text-primary hover:underline cursor-pointer"
                          >
                            {label}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <div className="flex flex-col gap-3">
            {myRequests.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-semibold">No requests submitted yet</p>
                <p className="text-sm text-muted-foreground mt-1">Browse loads and request one for your drivers</p>
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
                            <span className="font-mono text-sm text-muted-foreground">
                              {req.load_id ?? req.loadId}
                            </span>
                          </div>
                          {load && (
                            <p className="font-semibold text-foreground text-sm mb-1">
                              {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                            </p>
                          )}
                          <p className="text-sm text-foreground">
                            {req.driver_name ?? req.driverName} &middot; {req.company_name ?? req.companyName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {req.truck_type ?? req.truckType} &middot; #{req.truck_number ?? req.truckNumber}
                          </p>
                          {load && (load.pickup_date ?? load.pickupDate) && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              📅 Pickup: <span className="text-foreground">{load.pickup_date ?? load.pickupDate}</span>
                              {(load.dropoff_date ?? load.dropoffDate) && (
                                <> &middot; Dropoff: <span className="text-foreground">{load.dropoff_date ?? load.dropoffDate}</span></>
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

        <TabsContent value="loadboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableLoads.slice(0, 12).map((load) => (
              <LoadCard key={load.id} load={load} onRequestLoad={handleRequestLoad} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="booked">
          {myBookedLoads.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-semibold">No booked loads yet</p>
              <p className="text-sm text-muted-foreground mt-1">Browse the load board and request loads for your drivers</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myBookedLoads.map((load) => (
                <Card key={load.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-primary/15 text-primary border-0 text-[10px] font-bold uppercase">Booked</Badge>
                          <span className="font-mono text-sm text-muted-foreground">{load.id}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm">
                          {load.pickupCity ?? load.pickup_city}, {load.pickupState ?? load.pickup_state} → {load.dropoffCity ?? load.dropoff_city}, {load.dropoffState ?? load.dropoff_state}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {load.equipmentType ?? load.equipment_type} &middot; {(load.totalMiles ?? load.total_miles ?? 0)} mi &middot;{" "}
                          <span className="text-primary font-mono font-bold">${(load.payRate ?? load.pay_rate ?? 0).toLocaleString()}</span>
                        </p>
                        {(load.pickup_date ?? load.pickupDate) && (
                          <p className="text-sm text-muted-foreground mt-0.5">
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
          )}
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              {myRequests.length === 0 && (
                <p className="text-md text-muted-foreground p-2">No active loads to message about</p>
              )}
              {myRequests.map((req) => {
                const loadId = req.load_id ?? req.loadId
                const load = allLoads.find((l) => l.id === loadId)
                const loadMsgs = myMessages.filter((m) => (m.load_id ?? m.loadId) === loadId)
                const unread = loadMsgs.filter((m) => !m.read && (m.sender_role ?? m.senderRole) !== "dispatcher").length
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
                      <span className="font-mono text-sm text-muted-foreground">{loadId}</span>
                      {unread > 0 && (
                        <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
                      )}
                    </div>
                    <p className="text-md font-semibold text-foreground truncate">
                      {load ? `${load.pickupCity ?? load.pickup_city} → ${load.dropoffCity ?? load.dropoff_city}` : loadId}
                    </p>
                    <p className="text-md text-muted-foreground truncate mt-0.5">
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
                  currentUserId={currentUser?.id ?? "USR-004"}
                  currentUserName={dispatcherName}
                  currentUserRole="dispatcher"
                  load={allLoads.find((l) => l.id === messageLoadId)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-md">
                  Select a load to view messages
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-bold">Invite a Driver</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Send an email invite. The driver will receive a signup link to fill in their profile.
            </DialogDescription>
          </DialogHeader>
          {inviteSent ? (
            <div className="py-6 text-center">
              <Mail className="size-10 text-primary mx-auto mb-3" />
              <p className="text-foreground font-semibold">Invite Sent!</p>
              <p className="text-sm text-muted-foreground mt-1">The driver will receive an onboarding link at their email.</p>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-1.5">Driver Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-input border-border text-foreground"
                  placeholder="driver@company.com"
                  required
                />
              </div>
              <Button type="submit" className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90">
                <Mail className="size-4 mr-2" /> Send Invite
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <RequestLoadModal open={modalOpen} onClose={() => setModalOpen(false)} load={selectedLoad} currentUser={currentUser} />
    </DashboardShell>
  )
}