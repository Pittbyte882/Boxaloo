"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users, Package, Shield, ToggleLeft, ToggleRight,
  Search, LogOut, Key, ChevronDown, ChevronUp, CheckCircle, XCircle,
  UserCheck, X, AlertCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DashboardShell } from "@/components/dashboard-nav"
import { useUsers, useLoads, updateUserApi } from "@/hooks/use-api"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/store"

// ── Manual Activate Modal ──
function ActivateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [subscriptionId, setSubscriptionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleActivate() {
    if (!email || !customerId || !subscriptionId) {
      setError("All fields are required.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/activate-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
        },
        body: JSON.stringify({ email, customerId, subscriptionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to activate user.")
        return
      }
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-xl border p-6 shadow-2xl"
        style={{ background: "#0c0c0f", borderColor: "rgba(57,255,20,0.2)", boxShadow: "0 0 40px rgba(57,255,20,0.05)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(57,255,20,0.1)" }}>
              <UserCheck className="size-4" style={{ color: "#39ff14" }} />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">Manually Activate User</h2>
              <p className="text-xs text-muted-foreground">For users who paid but webhook failed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">User Email</Label>
            <Input
              className="bg-input border-border text-foreground"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
              Stripe Customer ID <span className="normal-case font-normal">(cus_xxx)</span>
            </Label>
            <Input
              className="bg-input border-border text-foreground font-mono text-sm"
              placeholder="cus_xxxxxxxxxxxxxxxxx"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
              Stripe Subscription ID <span className="normal-case font-normal">(sub_xxx)</span>
            </Label>
            <Input
              className="bg-input border-border text-foreground font-mono text-sm"
              placeholder="sub_xxxxxxxxxxxxxxxxx"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs bg-primary/10 rounded-lg px-3 py-2" style={{ color: "#39ff14" }}>
              <CheckCircle className="size-3.5 shrink-0" />
              User activated successfully!
            </div>
          )}

          <div
            className="text-xs rounded-lg px-3 py-2.5"
            style={{ background: "rgba(57,255,20,0.05)", border: "1px solid rgba(57,255,20,0.1)", color: "rgba(57,255,20,0.7)" }}
          >
            ⚠ This will set the user to <strong>active: true</strong>, save their Stripe IDs, and set subscription status to <strong>trialing</strong>.
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 border-border text-muted-foreground hover:text-foreground"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 font-bold uppercase tracking-wider hover:opacity-90"
              style={{ background: "#39ff14", color: "#000" }}
              onClick={handleActivate}
              disabled={loading || success}
            >
              {loading ? "Activating..." : "Activate User"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Admin Dashboard ──
export default function AdminDashboard() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showActivateModal, setShowActivateModal] = useState(false)

  const [applications, setApplications] = useState<any[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [expandedApp, setExpandedApp] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (!stored) { router.push("/"); return }
    const user = JSON.parse(stored)
    if (user.role !== "admin") { router.push("/"); return }
    setCurrentUser(user)
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    const { createClient } = require("@supabase/supabase-js")
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    Promise.all([
      client.from("api_key_applications").select("*").order("created_at", { ascending: false }),
      client.from("api_keys").select("*").order("created_at", { ascending: false }),
    ]).then(([{ data: apps }, { data: keys }]) => {
      setApplications(apps || [])
      setApiKeys(keys || [])
      setAppsLoading(false)
    })
  }, [currentUser])

  const { data: users = [], isLoading: usersLoading, mutate: refetchUsers } = useUsers({ role: roleFilter, search })
  const { data: allLoads = [], isLoading: loadsLoading } = useLoads()

  const toggleAccess = async (userId: string) => {
    const user = users.find((u: User) => u.id === userId)
    if (!user) return
    await updateUserApi(userId, { active: !user.active })
  }

  const handleLogout = () => {
    sessionStorage.removeItem("boxaloo_user")
    router.push("/")
  }

  const handleApprove = async (applicationId: string) => {
    setApprovingId(applicationId)
    try {
      const res = await fetch("/api/api-keys/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
        },
        body: JSON.stringify({ applicationId }),
      })
      if (!res.ok) throw new Error("Failed to approve")
      window.location.reload()
    } catch (err) {
      console.error("Approve error:", err)
      alert("Failed to approve application.")
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    const reason = prompt("Reason for rejection (optional):")
    setRejectingId(applicationId)
    try {
      const { createClient } = require("@supabase/supabase-js")
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await client
        .from("api_key_applications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || "Does not meet requirements",
        })
        .eq("id", applicationId)
      window.location.reload()
    } catch (err) {
      console.error("Reject error:", err)
    } finally {
      setRejectingId(null)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Revoke this API key? The broker will immediately lose access.")) return
    setRevokingId(keyId)
    try {
      const res = await fetch("/api/api-keys/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
        },
        body: JSON.stringify({ keyId, reason: "Revoked by admin" }),
      })
      if (!res.ok) throw new Error("Failed to revoke")
      window.location.reload()
    } catch (err) {
      console.error("Revoke error:", err)
      alert("Failed to revoke key.")
    } finally {
      setRevokingId(null)
    }
  }

  const totalLoads = allLoads.length
  const totalBrokers = users.filter((u: User) => u.role === "broker").length
  const pendingApps = applications.filter((a) => a.status === "pending").length
  const inactiveCarriers = users.filter((u: User) =>
    (u.role === "carrier" || u.role === "dispatcher") && !u.active
  ).length

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-primary/15 text-primary",
    broker: "bg-[#4d9efe]/15 text-[#4d9efe]",
    dispatcher: "bg-[#ffd166]/15 text-[#ffd166]",
    carrier: "bg-[#fe4ddb]/15 text-[#fe4ddb]",
  }

  const statusColor: Record<string, string> = {
    pending: "bg-[#ffd166]/15 text-[#ffd166]",
    approved: "bg-primary/15 text-primary",
    rejected: "bg-destructive/15 text-destructive",
  }

  if (!currentUser) return null

  return (
    <DashboardShell role="admin">
      {showActivateModal && (
        <ActivateUserModal
          onClose={() => setShowActivateModal(false)}
          onSuccess={() => { if (refetchUsers) refetchUsers() }}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {currentUser.name} &middot; Master control panel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setShowActivateModal(true)}
            className="font-bold text-xs uppercase tracking-wider"
            style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.3)", color: "#39ff14" }}
          >
            <UserCheck className="size-3.5 mr-2" />
            Activate User
            {inactiveCarriers > 0 && (
              <span
                className="ml-2 size-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: "#39ff14", color: "#000" }}
              >
                {inactiveCarriers}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}
            className="border-border text-muted-foreground hover:text-foreground">
            <LogOut className="size-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{usersLoading ? "—" : users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{loadsLoading ? "—" : totalLoads}</p>
              <p className="text-xs text-muted-foreground">Total Loads</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#4d9efe]/10 flex items-center justify-center">
              <Shield className="size-5 text-[#4d9efe]" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{usersLoading ? "—" : totalBrokers}</p>
              <p className="text-xs text-muted-foreground">Brokers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#ffd166]/10 flex items-center justify-center">
              <Key className="size-5 text-[#ffd166]" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">{appsLoading ? "—" : pendingApps}</p>
              <p className="text-xs text-muted-foreground">Pending API Apps</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Users className="size-3.5 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="api-applications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary relative">
            <Key className="size-3.5 mr-2" /> API Applications
            {pendingApps > 0 && (
              <span className="ml-2 size-4 rounded-full bg-[#ffd166] text-black text-[9px] font-bold flex items-center justify-center">
                {pendingApps}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Shield className="size-3.5 mr-2" /> Active Keys
          </TabsTrigger>
        </TabsList>

        {/* ── USERS TAB ── */}
        <TabsContent value="users">
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border text-foreground h-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] bg-card border-border text-foreground h-10">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="broker">Brokers</SelectItem>
                <SelectItem value="dispatcher">Dispatchers</SelectItem>
                <SelectItem value="carrier">Carriers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">User</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Role</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Company</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">MC#</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">FMCSA</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Trial Ends</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold text-right">Access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12 text-sm">Loading users...</TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12 text-sm">No users found.</TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: User) => (
                        <TableRow key={user.id} className="border-border">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-0 text-[10px] font-bold uppercase tracking-wider", roleBadgeColor[user.role])}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.company || "—"}</TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{user.broker_mc || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.fmcsa_authorized
                              ? <span className="text-primary font-semibold text-xs">✓ Verified</span>
                              : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-0 text-[10px] font-bold uppercase tracking-wider",
                              user.active ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
                              {user.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!user.active && (user.role === "carrier" || user.role === "dispatcher") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowActivateModal(true)}
                                  className="h-7 text-xs"
                                  style={{ borderColor: "rgba(57,255,20,0.3)", color: "#39ff14" }}
                                >
                                  <UserCheck className="size-3 mr-1" /> Activate
                                </Button>
                              )}
                              {user.role !== "admin" && (
                                <Button variant="outline" size="sm" onClick={() => toggleAccess(user.id)}
                                  className={cn("h-7 text-xs border-border", user.active ? "text-muted-foreground" : "text-primary")}>
                                  {user.active
                                    ? <><ToggleRight className="size-3 mr-1" /> Disable</>
                                    : <><ToggleLeft className="size-3 mr-1" /> Enable</>}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── API APPLICATIONS TAB ── */}
        <TabsContent value="api-applications">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {appsLoading ? (
                <p className="text-center text-muted-foreground py-12 text-sm">Loading applications...</p>
              ) : applications.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">No applications yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{app.company_name}</p>
                            <p className="text-xs text-muted-foreground">{app.contact_email} · MC#{app.mc_number}</p>
                          </div>
                          <Badge className={cn("border-0 text-[10px] font-bold uppercase tracking-wider", statusColor[app.status])}>
                            {app.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.status === "pending" && (
                            <>
                              <Button size="sm"
                                onClick={() => handleApprove(app.id)}
                                disabled={approvingId === app.id}
                                className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                                <CheckCircle className="size-3 mr-1" />
                                {approvingId === app.id ? "Approving..." : "Approve"}
                              </Button>
                              <Button size="sm" variant="outline"
                                onClick={() => handleReject(app.id)}
                                disabled={rejectingId === app.id}
                                className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10">
                                <XCircle className="size-3 mr-1" />
                                {rejectingId === app.id ? "Rejecting..." : "Reject"}
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost"
                            onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                            className="h-7 text-xs text-muted-foreground">
                            {expandedApp === app.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </Button>
                        </div>
                      </div>

                      {expandedApp === app.id && (
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 p-4 rounded-lg bg-accent/30 border border-border">
                          {[
                            ["Legal Name", app.legal_name],
                            ["Contact", app.contact_name],
                            ["Phone", app.contact_phone || "—"],
                            ["Website", app.website || "—"],
                            ["Monthly Volume", app.monthly_load_volume],
                            ["TMS Software", app.tms_software],
                            ["Has Dev Team", app.has_dev_team ? "Yes" : "No"],
                            ["Heard About Us", app.heard_about_us || "—"],
                            ["FMCSA Verified", app.fmcsa_authorized ? "✓ Yes" : "No"],
                            ["Applied", new Date(app.created_at).toLocaleDateString()],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                              <p className="text-sm text-foreground">{value}</p>
                            </div>
                          ))}
                          <div className="lg:col-span-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Reason for Access</p>
                            <p className="text-sm text-foreground">{app.reason_for_access}</p>
                          </div>
                          {app.rejection_reason && (
                            <div className="lg:col-span-2">
                              <p className="text-[10px] text-destructive uppercase tracking-wider font-semibold">Rejection Reason</p>
                              <p className="text-sm text-foreground">{app.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACTIVE KEYS TAB ── */}
        <TabsContent value="api-keys">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {appsLoading ? (
                <p className="text-center text-muted-foreground py-12 text-sm">Loading keys...</p>
              ) : apiKeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">No API keys issued yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Company</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">MC#</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Key Prefix</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Requests</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Last Used</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                        <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id} className="border-border">
                          <TableCell>
                            <p className="font-semibold text-foreground text-sm">{key.company_name}</p>
                            <p className="text-xs text-muted-foreground">{key.contact_email}</p>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{key.mc_number}</TableCell>
                          <TableCell className="text-sm font-mono text-primary">{key.key_prefix}...</TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{key.total_requests.toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-0 text-[10px] font-bold uppercase tracking-wider",
                              key.active ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
                              {key.active ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {key.active && (
                              <Button size="sm" variant="outline"
                                onClick={() => handleRevoke(key.id)}
                                disabled={revokingId === key.id}
                                className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10">
                                {revokingId === key.id ? "Revoking..." : "Revoke"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
