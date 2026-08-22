"use client"

import { useState, useEffect } from "react"
import {
  Users, Package, Shield, Key, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, UserCheck, Loader2, FileSpreadsheet,
  Globe, RefreshCw, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardShell } from "@/components/dashboard-nav"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [apiApplications, setApiApplications] = useState<any[]>([])
  const [activeKeys, setActiveKeys] = useState<any[]>([])
  const [csvLoads, setCsvLoads] = useState<any[]>([])
  const [apiLoads, setApiLoads] = useState<any[]>([])
  const [allLoads, setAllLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) setCurrentUser(JSON.parse(stored))
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const headers = { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" }

      const [usersRes, appsRes, keysRes, loadsRes] = await Promise.all([
        fetch("/api/users", { headers }),
        fetch("/api/api-keys/applications", { headers }),
        fetch("/api/api-keys", { headers }),
        fetch("/api/loads", { headers }),
      ])

      const [usersData, appsData, keysData, loadsData] = await Promise.all([
        usersRes.json(),
        appsRes.json(),
        keysRes.json(),
        loadsRes.json(),
      ])

      setUsers(Array.isArray(usersData) ? usersData : [])
      setApiApplications(Array.isArray(appsData) ? appsData : [])
      setActiveKeys(Array.isArray(keysData) ? keysData : [])

      const loads = Array.isArray(loadsData) ? loadsData : []
      setAllLoads(loads)
      setCsvLoads(loads.filter((l: any) => l.upload_source === "csv"))
      setApiLoads(loads.filter((l: any) => l.upload_source === "api" || l.posted_via_api === true))
    } catch (err) {
      console.error("Admin fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleAccess = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setTogglingId(userId)
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "",
        },
        body: JSON.stringify({ active: !user.active }),
      })
      fetchAll()
    } finally {
      setTogglingId(null)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Revoke this API key? The broker will lose access immediately.")) return
    setRevokingId(keyId)
    try {
      await fetch("/api/api-keys/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "",
        },
        body: JSON.stringify({ keyId }),
      })
      fetchAll()
    } finally {
      setRevokingId(null)
    }
  }

  const handleRegenerate = async (keyId: string) => {
    if (!confirm("Regenerate this API key? The broker's old key will stop working immediately and they'll receive a new key by email.")) return
    setRegeneratingId(keyId)
    try {
      await fetch("/api/api-keys/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "",
        },
        body: JSON.stringify({ keyId }),
      })
      alert("New key generated and emailed to the broker!")
      fetchAll()
    } catch {
      alert("Failed to regenerate key.")
    } finally {
      setRegeneratingId(null)
    }
  }

  const handleApprove = async (appId: string) => {
    await fetch(`/api/api-keys/applications/${appId}/approve`, {
      method: "POST",
      headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "" },
    })
    fetchAll()
  }

  const handleReject = async (appId: string) => {
    await fetch(`/api/api-keys/applications/${appId}/reject`, {
      method: "POST",
      headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "" },
    })
    fetchAll()
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase()
    const matchesSearch =
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.company_name ?? "").toLowerCase().includes(q)
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  const pendingApps = apiApplications.filter((a) => a.status === "pending")
  const totalUsers = users.length
  const totalLoads = allLoads.length
  const totalBrokers = users.filter((u) => u.role === "broker").length
  const pendingApiApps = pendingApps.length

  if (loading) {
    return (
      <DashboardShell role="admin" userName={currentUser?.name ?? "Admin"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="admin" userName={currentUser?.name ?? "Admin"}>
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-400" },
            { label: "Total Loads", value: totalLoads, icon: Package, color: "text-primary" },
            { label: "Brokers", value: totalBrokers, icon: Shield, color: "text-blue-500" },
            { label: "Pending API Apps", value: pendingApiApps, icon: Key, color: "text-[#ffd166]" },
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

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
            <TabsList className="bg-card border border-border w-max lg:w-auto">
              <TabsTrigger value="users" className="text-base">
                Users
                {totalUsers > 0 && (
                  <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{totalUsers}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="applications" className="text-base">
                API Applications
                {pendingApiApps > 0 && (
                  <Badge className="ml-2 bg-[#ffd166]/20 text-[#ffd166] border-0 text-[10px] px-1.5">{pendingApiApps}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activekeys" className="text-base">
                Active Keys
                {activeKeys.filter((k) => k.active).length > 0 && (
                  <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                    {activeKeys.filter((k) => k.active).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="apiloads" className="text-base">
                API Uploads
                {apiLoads.length > 0 && (
                  <Badge className="ml-2 bg-primary/20 text-primary border-0 text-[10px] px-1.5">{apiLoads.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="csvloads" className="text-base">
                CSV Uploads
                {csvLoads.length > 0 && (
                  <Badge className="ml-2 bg-[#ffd166]/20 text-[#ffd166] border-0 text-[10px] px-1.5">{csvLoads.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Users Tab ── */}
          <TabsContent value="users">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Input
                placeholder="Search users by name, email, or company..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-card border-border text-foreground flex-1"
              />
              <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                <SelectTrigger className="bg-card border-border w-full sm:w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="carrier">Carrier</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">User</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Role</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Company</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">MC#</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">FMCSA</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Trial Ends</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-0 text-[10px] uppercase font-bold tracking-wider",
                          user.role === "broker" ? "bg-blue-500/15 text-blue-400"
                            : user.role === "carrier" ? "bg-primary/15 text-primary"
                              : user.role === "dispatcher" ? "bg-purple-500/15 text-purple-400"
                                : "bg-[#ffd166]/15 text-[#ffd166]"
                        )}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.company_name ?? "—"}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{user.broker_mc ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.fmcsa_verified ? (
                          <span className="text-primary text-xs font-semibold">✓ Verified</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-0 text-[10px] uppercase font-bold",
                          user.active ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                        )}>
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.active && (user.role === "carrier" || user.role === "dispatcher") && (
                            <Button variant="outline" size="sm"
                              onClick={() => setShowActivateModal(true)}
                              className="h-7 text-xs"
                              style={{ borderColor: "rgba(57,255,20,0.3)", color: "#39ff14" }}>
                              <UserCheck className="size-3 mr-1" /> Activate
                            </Button>
                          )}
                          {user.role !== "admin" && (
                            <Button variant="outline" size="sm"
                              onClick={() => toggleAccess(user.id)}
                              disabled={togglingId === user.id}
                              className={cn("h-7 text-xs border-border", user.active ? "text-muted-foreground" : "text-primary")}>
                              {togglingId === user.id ? <Loader2 className="size-3 animate-spin" /> :
                                user.active
                                  ? <><ToggleRight className="size-3 mr-1" /> Disable</>
                                  : <><ToggleLeft className="size-3 mr-1" /> Enable</>}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── API Applications Tab ── */}
          <TabsContent value="applications">
            <div className="flex flex-col gap-3">
              {apiApplications.length === 0 ? (
                <div className="py-16 text-center">
                  <Key className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-semibold">No applications yet</p>
                </div>
              ) : (
                apiApplications.map((app) => (
                  <Card key={app.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-foreground">{app.company_name}</p>
                          <p className="text-sm text-muted-foreground">{app.contact_email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            MC: <span className="font-mono text-foreground">{app.mc_number}</span>
                            {app.reason && <> &middot; {app.reason}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "border-0 text-[10px] uppercase font-bold",
                            app.status === "pending" ? "bg-[#ffd166]/15 text-[#ffd166]"
                              : app.status === "approved" ? "bg-primary/15 text-primary"
                                : "bg-destructive/15 text-destructive"
                          )}>
                            {app.status}
                          </Badge>
                          {app.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleApprove(app.id)}
                                className="bg-primary text-primary-foreground h-7 text-xs font-bold">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(app.id)}
                                className="border-destructive/50 text-destructive h-7 text-xs">
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── Active Keys Tab ── */}
          <TabsContent value="activekeys">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Company</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">MC#</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Key Prefix</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Requests</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Rate Limit</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Last Used</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeKeys.map((key) => (
                    <TableRow key={key.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{key.company_name}</p>
                          <p className="text-xs text-muted-foreground">{key.contact_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{key.mc_number}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-primary">{key.key_prefix}...</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{key.total_requests ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{key.rate_limit ?? 100}/hr</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-0 text-[10px] uppercase font-bold",
                          key.active ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                        )}>
                          {key.active ? "Active" : "Revoked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {key.active && (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline"
                              onClick={() => handleRegenerate(key.id)}
                              disabled={regeneratingId === key.id}
                              className="h-7 text-xs"
                              style={{ borderColor: "rgba(57,255,20,0.3)", color: "#39ff14" }}>
                              {regeneratingId === key.id
                                ? <Loader2 className="size-3 animate-spin" />
                                : <><RefreshCw className="size-3 mr-1" /> Regenerate</>}
                            </Button>
                            <Button size="sm" variant="outline"
                              onClick={() => handleRevoke(key.id)}
                              disabled={revokingId === key.id}
                              className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10">
                              {revokingId === key.id
                                ? <Loader2 className="size-3 animate-spin" />
                                : "Revoke"}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── API Uploads Tab ── */}
          <TabsContent value="apiloads">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Load ID</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Route</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Equipment</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Pay Rate</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Broker MC</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Broker</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Posted</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiLoads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Globe className="size-8 mx-auto mb-2 opacity-50" />
                        No API uploads yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiLoads.map((load) => (
                      <TableRow key={load.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">{load.id}</TableCell>
                        <TableCell className="text-sm text-foreground font-medium">
                          {load.pickup_city}, {load.pickup_state} → {load.dropoff_city}, {load.dropoff_state}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{load.equipment_type}</TableCell>
                        <TableCell className="text-sm text-primary font-mono font-bold">
                          ${(load.pay_rate ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{load.broker_mc}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{load.broker_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {load.posted_at ? new Date(load.posted_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "border-0 text-[10px] uppercase font-bold",
                            load.status === "Available" ? "bg-primary/15 text-primary"
                              : load.status === "Booked" ? "bg-blue-500/15 text-blue-400"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {load.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── CSV Uploads Tab ── */}
          <TabsContent value="csvloads">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Load ID</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Route</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Equipment</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Pay Rate</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Broker MC</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Broker</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Posted</TableHead>
                    <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvLoads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <FileSpreadsheet className="size-8 mx-auto mb-2 opacity-50" />
                        No CSV uploads yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    csvLoads.map((load) => (
                      <TableRow key={load.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">{load.id}</TableCell>
                        <TableCell className="text-sm text-foreground font-medium">
                          {load.pickup_city}, {load.pickup_state} → {load.dropoff_city}, {load.dropoff_state}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{load.equipment_type}</TableCell>
                        <TableCell className="text-sm text-primary font-mono font-bold">
                          ${(load.pay_rate ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{load.broker_mc}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{load.broker_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {load.posted_at ? new Date(load.posted_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "border-0 text-[10px] uppercase font-bold",
                            load.status === "Available" ? "bg-primary/15 text-primary"
                              : load.status === "Booked" ? "bg-blue-500/15 text-blue-400"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {load.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
