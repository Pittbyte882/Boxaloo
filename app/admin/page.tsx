"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Package,
  Shield,
  Activity,
  ToggleLeft,
  ToggleRight,
  Search,
  LogOut,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardShell } from "@/components/dashboard-nav"
import { useUsers, useLoads, updateUserApi } from "@/hooks/use-api"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Guard — must be admin
  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (!stored) {
      router.push("/")
      return
    }
    const user = JSON.parse(stored)
    if (user.role !== "admin") {
      router.push("/")
      return
    }
    setCurrentUser(user)
  }, [router])

  const { data: users = [], isLoading: usersLoading } = useUsers({ role: roleFilter, search })
  const { data: allLoads = [], isLoading: loadsLoading } = useLoads()

  const toggleAccess = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    await updateUserApi(userId, { active: !user.active })
  }

  const handleLogout = () => {
    sessionStorage.removeItem("boxaloo_user")
    router.push("/")
  }

  const totalLoads = allLoads.length
  const availableLoads = allLoads.filter((l) => l.status === "Available").length
  const totalBrokers = users.filter((u) => u.role === "broker").length
  const totalCarriers =
    users.filter((u) => u.role === "carrier").length +
    users.filter((u) => u.role === "dispatcher").length

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-primary/15 text-primary",
    broker: "bg-[#4d9efe]/15 text-[#4d9efe]",
    dispatcher: "bg-[#ffd166]/15 text-[#ffd166]",
    carrier: "bg-[#fe4ddb]/15 text-[#fe4ddb]",
  }

  if (!currentUser) return null

  return (
    <DashboardShell role="admin">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {currentUser.name} &middot; Master control panel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4 mr-2" />
          Log Out
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {usersLoading ? "—" : users.length}
              </p>
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
              <p className="text-2xl font-bold font-mono text-foreground">
                {loadsLoading ? "—" : totalLoads}
              </p>
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
              <p className="text-2xl font-bold font-mono text-foreground">
                {usersLoading ? "—" : totalBrokers}
              </p>
              <p className="text-xs text-muted-foreground">Brokers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-accent flex items-center justify-center">
              <Activity className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {loadsLoading ? "—" : availableLoads}
              </p>
              <p className="text-xs text-muted-foreground">Active Loads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">User</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Role</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Company</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Trial Ends</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-semibold text-right">Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-0 text-[10px] font-bold uppercase tracking-wider",
                            roleBadgeColor[user.role]
                          )}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.company || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.trial_ends_at
                          ? new Date(user.trial_ends_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-0 text-[10px] font-bold uppercase tracking-wider",
                            user.active
                              ? "bg-primary/15 text-primary"
                              : "bg-destructive/15 text-destructive"
                          )}
                        >
                          {user.active ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAccess(user.id)}
                            className={cn(
                              "h-7 text-xs border-border",
                              user.active ? "text-muted-foreground" : "text-primary"
                            )}
                          >
                            {user.active ? (
                              <><ToggleRight className="size-3 mr-1" /> Disable</>
                            ) : (
                              <><ToggleLeft className="size-3 mr-1" /> Enable</>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}