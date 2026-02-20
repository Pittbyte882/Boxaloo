"use client"

import { useState, useCallback } from "react"
import { Search, SlidersHorizontal, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LoadCard } from "@/components/load-card"
import { RequestLoadModal } from "@/components/request-load-modal"
import { DashboardShell } from "@/components/dashboard-nav"
import { useLoads } from "@/hooks/use-api"
import type { Load, EquipmentType } from "@/lib/mock-data"

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

export default function LoadBoardPage() {
  const [search, setSearch] = useState("")
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Debounced search - only passes to API when user stops typing
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    const timeout = setTimeout(() => setDebouncedSearch(val), 300)
    return () => clearTimeout(timeout)
  }, [])

  const { data: loads = [], isLoading } = useLoads({
    search: debouncedSearch,
    equipmentType: equipmentFilter,
    status: statusFilter,
  })

  const availableCount = loads.filter((l) => l.status === "Available").length
  const bookedCount = loads.filter((l) => l.status === "Booked").length

  const handleRequestLoad = (load: Load) => {
    setSelectedLoad(load)
    setModalOpen(true)
  }

  return (
    <DashboardShell role="broker">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Live Load Board</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time freight matching for box trucks, cargo vans & more</p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Badge className="bg-primary/15 text-primary border-0 font-mono text-xs px-3 py-1.5">
              <Package className="size-3 mr-1" />
              {availableCount} Available
            </Badge>
            <Badge className="bg-muted text-muted-foreground border-0 font-mono text-xs px-3 py-1.5">
              {bookedCount} Booked
            </Badge>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by city, state, load ID, or keywords..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card border-border text-foreground h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden border-border text-muted-foreground"
          >
            <SlidersHorizontal className="size-4 mr-2" />
            Filters
          </Button>
          <div className={`flex gap-3 ${showFilters ? "flex" : "hidden lg:flex"}`}>
            <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
              <SelectTrigger className="w-[160px] bg-card border-border text-foreground h-10">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-foreground">All Equipment</SelectItem>
                {equipmentTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-card border-border text-foreground h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-foreground">All Status</SelectItem>
                <SelectItem value="Available" className="text-foreground">Available</SelectItem>
                <SelectItem value="Booked" className="text-foreground">Booked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile stats */}
        <div className="flex lg:hidden items-center gap-3">
          <Badge className="bg-primary/15 text-primary border-0 font-mono text-xs px-2.5 py-1">
            {availableCount} Available
          </Badge>
          <Badge className="bg-muted text-muted-foreground border-0 font-mono text-xs px-2.5 py-1">
            {bookedCount} Booked
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">{loads.length} loads shown</span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground text-sm">Loading loads...</p>
        </div>
      )}

      {/* Load grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {loads.map((load) => (
            <LoadCard key={load.id} load={load} onRequestLoad={handleRequestLoad} />
          ))}
        </div>
      )}

      {!isLoading && loads.length === 0 && (
        <div className="py-20 text-center">
          <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground font-semibold">No loads match your filters</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
        </div>
      )}

      <RequestLoadModal open={modalOpen} onClose={() => setModalOpen(false)} load={selectedLoad} />
    </DashboardShell>
  )
}
