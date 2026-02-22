"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, SlidersHorizontal, Package, ChevronDown, ChevronUp, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LoadCard } from "@/components/load-card"
import { RequestLoadModal } from "@/components/request-load-modal"
import { DashboardShell } from "@/components/dashboard-nav"
import { CityAutocomplete } from "@/components/city-autocomplete"
import { useLoads } from "@/hooks/use-api"
import type { Load, EquipmentType } from "@/lib/mock-data"

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]
const radiusOptions = [25, 50, 100, 200, 500]

export default function LoadBoardPage() {
  const [userRole, setUserRole] = useState<string>("")
  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) {
      const user = JSON.parse(stored)
      setUserRole(user.role)
    }
  }, [])

  const [search, setSearch] = useState("")
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Advanced search state
  const [originCity, setOriginCity] = useState("")
  const [destinationCity, setDestinationCity] = useState("")
  const [radius, setRadius] = useState(100)
  const [advancedResults, setAdvancedResults] = useState<Load[] | null>(null)
  const [advancedLoading, setAdvancedLoading] = useState(false)
  const [advancedError, setAdvancedError] = useState("")

  const [debouncedSearch, setDebouncedSearch] = useState("")
  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    const timeout = setTimeout(() => setDebouncedSearch(val), 300)
    return () => clearTimeout(timeout)
  }, [])

  const { data: allLoads = [], isLoading } = useLoads({
    search: debouncedSearch,
    equipmentType: equipmentFilter,
    status: statusFilter,
  })

  const loads = advancedResults !== null ? advancedResults : allLoads

  const availableCount = loads.filter((l) => l.status === "Available").length
  const bookedCount = loads.filter((l) => l.status === "Booked").length

  const handleRequestLoad = (load: Load) => {
    setSelectedLoad(load)
    setModalOpen(true)
  }

  const clearAdvanced = () => {
    setAdvancedResults(null)
    setOriginCity("")
    setDestinationCity("")
    setRadius(100)
    setAdvancedError("")
  }

  const handleAdvancedSearch = async () => {
    if (!originCity) {
      setAdvancedError("Please enter an origin city")
      return
    }
    setAdvancedLoading(true)
    setAdvancedError("")
    try {
      const geoRes = await fetch(`/api/here/geocode?city=${encodeURIComponent(originCity)}`)
      const geoData = await geoRes.json()
      if (!geoData.lat || !geoData.lng) {
        setAdvancedError("Could not find that city. Try entering City, State format.")
        setAdvancedLoading(false)
        return
      }

      const originLat = geoData.lat
      const originLng = geoData.lng

      let filtered = allLoads.filter((load) => {
        const lat = (load as any).pickup_lat
        const lng = (load as any).pickup_lng
        if (!lat || !lng) return false
        const R = 3958.8
        const dLat = (lat - originLat) * Math.PI / 180
        const dLng = (lng - originLng) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(originLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const miles = R * c
        return miles <= radius
      })

      if (destinationCity.trim()) {
        const dest = destinationCity.toLowerCase()
        filtered = filtered.filter((load) =>
          (load.dropoff_city ?? "").toLowerCase().includes(dest) ||
          (load.dropoff_state ?? "").toLowerCase().includes(dest)
        )
      }

      if (equipmentFilter !== "all") {
        filtered = filtered.filter((load) =>
          (load.equipment_type ?? "") === equipmentFilter
        )
      }

      setAdvancedResults(filtered)
    } catch {
      setAdvancedError("Search failed. Please try again.")
    } finally {
      setAdvancedLoading(false)
    }
  }

  return (
    <DashboardShell role={userRole as any}>
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

        {/* Basic Search + Filters */}
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

        {/* Advanced Search Toggle */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
          >
            <SlidersHorizontal className="size-3.5" />
            Advanced Search
            {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {showAdvanced && (
            <div
              className="mt-3 p-4 rounded-lg border"
              style={{ background: "rgba(42,223,10,0.03)", borderColor: "rgba(42,223,10,0.15)" }}
            >
              <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">
                Search by Location & Radius
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Origin City</label>
                  <CityAutocomplete
                    value={originCity}
                    onChange={(label, city, state) => setOriginCity(label)}
                    placeholder="e.g. Dallas, TX"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Destination (optional)</label>
                  <CityAutocomplete
                    value={destinationCity}
                    onChange={(label, city, state) => setDestinationCity(label)}
                    placeholder="e.g. Houston, TX"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Radius: <span className="text-primary font-mono font-bold">{radius} miles</span>
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="range"
                      min={25}
                      max={500}
                      step={25}
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    {radiusOptions.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRadius(r)}
                        className={`px-1 rounded transition-colors ${radius === r ? "text-primary font-bold" : "hover:text-foreground"}`}
                      >
                        {r}mi
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {advancedError && (
                <p className="text-xs text-destructive mb-2">{advancedError}</p>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAdvancedSearch}
                  disabled={advancedLoading}
                  className="bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs h-8 hover:bg-primary/90"
                >
                  {advancedLoading ? "Searching..." : "Search"}
                </Button>
                {advancedResults !== null && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAdvanced}
                    className="border-border text-muted-foreground h-8 text-xs"
                  >
                    <X className="size-3 mr-1" /> Clear
                  </Button>
                )}
                {advancedResults !== null && (
                  <span className="text-xs text-muted-foreground">
                    {advancedResults.length} load{advancedResults.length !== 1 ? "s" : ""} found within {radius} miles
                  </span>
                )}
              </div>
            </div>
          )}
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

      {isLoading && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground text-sm">Loading loads...</p>
        </div>
      )}

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