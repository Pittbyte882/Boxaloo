"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Search, SlidersHorizontal, Package, X, ChevronDown, ChevronUp } from "lucide-react"
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

// Haversine distance in miles
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function LoadBoardPage() {
  const [userRole, setUserRole] = useState<string>("")
  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) setUserRole(JSON.parse(stored).role)
  }, [])

  // Basic filters (sent to API)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [equipmentFilter, setEquipmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("Available")
  const [minPay, setMinPay] = useState("")
  const [maxPay, setMaxPay] = useState("")
  const [maxWeight, setMaxWeight] = useState("")

  // Advanced / location filters (client-side radius)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [originCity, setOriginCity] = useState("")
  const [originLat, setOriginLat] = useState<number | null>(null)
  const [originLng, setOriginLng] = useState<number | null>(null)
  const [destinationCity, setDestinationCity] = useState("")
  const [radius, setRadius] = useState(100)
  const [advancedActive, setAdvancedActive] = useState(false)
  const [advancedLoading, setAdvancedLoading] = useState(false)
  const [advancedError, setAdvancedError] = useState("")

  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    if (debounceRef.current)clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300)
  }, [])

  const { data: allLoads = [], isLoading } = useLoads({
    search: debouncedSearch || undefined,
    equipmentType: equipmentFilter !== "all" ? equipmentFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    minPay: minPay ? Number(minPay) : undefined,
    maxPay: maxPay ? Number(maxPay) : undefined,
    maxWeight: maxWeight ? Number(maxWeight) : undefined,
  })

  // Client-side radius filter on top of API results
  const loads = advancedActive && originLat !== null && originLng !== null
    ? allLoads.filter((load) => {
        const lat = (load as any).pickup_lat
        const lng = (load as any).pickup_lng

        // Fallback: if no coords, match by city/state text
        if (!lat || !lng) {
          const originText = originCity.toLowerCase()
          const cityMatch =
            (load.pickup_city ?? "").toLowerCase().includes(originText.split(",")[0].trim()) ||
            (load.pickup_state ?? "").toLowerCase().includes(originText.split(",")[1]?.trim() ?? "")
          if (!cityMatch) return false
        } else {
          const miles = haversine(originLat, originLng, lat, lng)
          if (miles > radius) return false
        }

        // Destination filter
        if (destinationCity.trim()) {
          const dest = destinationCity.toLowerCase()
          const destMatch =
            (load.dropoff_city ?? "").toLowerCase().includes(dest.split(",")[0].trim()) ||
            (load.dropoff_state ?? "").toLowerCase().includes(dest.split(",")[1]?.trim() ?? dest)
          if (!destMatch) return false
        }

        return true
      })
    : allLoads

  const activeFilterCount = [
    equipmentFilter !== "all",
    statusFilter !== "all",
    minPay !== "",
    maxPay !== "",
    maxWeight !== "",
    advancedActive,
  ].filter(Boolean).length

  const clearAll = () => {
    setSearch("")
    setDebouncedSearch("")
    setEquipmentFilter("all")
    setStatusFilter("Available")
    setMinPay("")
    setMaxPay("")
    setMaxWeight("")
    setOriginCity("")
    setOriginLat(null)
    setOriginLng(null)
    setDestinationCity("")
    setRadius(100)
    setAdvancedActive(false)
    setAdvancedError("")
  }

  const handleAdvancedSearch = async () => {
    if (!originCity.trim()) {
      setAdvancedError("Please enter an origin city")
      return
    }
    setAdvancedLoading(true)
    setAdvancedError("")
    try {
      const geoRes = await fetch(
        `/api/here/geocode?city=${encodeURIComponent(originCity)}`,
        { headers: { "x-internal-secret": process.env.NEXT_PUBLIC_INTERNAL_SECRET ?? "" } }
      )
      const geoData = await geoRes.json()
      if (!geoData.lat || !geoData.lng) {
        setAdvancedError("Could not find that city. Try City, State format.")
        setAdvancedLoading(false)
        return
      }
      setOriginLat(geoData.lat)
      setOriginLng(geoData.lng)
      setAdvancedActive(true)
    } catch {
      setAdvancedError("Search failed. Please try again.")
    } finally {
      setAdvancedLoading(false)
    }
  }

  const clearAdvanced = () => {
    setOriginCity("")
    setOriginLat(null)
    setOriginLng(null)
    setDestinationCity("")
    setRadius(100)
    setAdvancedActive(false)
    setAdvancedError("")
  }

  const availableCount = loads.filter((l) => l.status === "Available").length
  const bookedCount = loads.filter((l) => l.status === "Booked").length

  return (
    <DashboardShell role={userRole as any}>
      <div className="flex flex-col gap-4 mb-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Live Load Board</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time freight matching for box trucks, cargo vans & more</p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Badge className="bg-primary/15 text-primary border-0 font-mono text-xs px-3 py-1.5">
              <Package className="size-3 mr-1" />{availableCount} Available
            </Badge>
            <Badge className="bg-muted text-muted-foreground border-0 font-mono text-xs px-3 py-1.5">
              {bookedCount} Booked
            </Badge>
          </div>
        </div>

        {/* Search bar row */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search city, state, load ID..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card border-border text-foreground h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden border-border text-muted-foreground relative"
          >
            <SlidersHorizontal className="size-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}
              className="border-border text-muted-foreground h-10 hidden lg:flex">
              <X className="size-3 mr-1" /> Clear All
            </Button>
          )}
        </div>

        {/* Filter row — always visible on desktop, toggle on mobile */}
        <div className={`flex flex-col lg:flex-row gap-3 ${showFilters ? "flex" : "hidden lg:flex"}`}>
          
          {/* Equipment */}
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-full lg:w-[160px] bg-card border-border text-foreground h-10">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-foreground">All Equipment</SelectItem>
              {equipmentTypes.map((t) => (
                <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-[140px] bg-card border-border text-foreground h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-foreground">All Status</SelectItem>
              <SelectItem value="Available" className="text-foreground">Available</SelectItem>
              <SelectItem value="Booked" className="text-foreground">Booked</SelectItem>
            </SelectContent>
          </Select>

          {/* Min Pay */}
          <div className="relative w-full lg:w-[130px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              className="pl-7 bg-card border-border text-foreground h-10"
              placeholder="Min Pay"
              type="number"
              value={minPay}
              onChange={(e) => setMinPay(e.target.value)}
            />
          </div>

          {/* Max Pay */}
          <div className="relative w-full lg:w-[130px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              className="pl-7 bg-card border-border text-foreground h-10"
              placeholder="Max Pay"
              type="number"
              value={maxPay}
              onChange={(e) => setMaxPay(e.target.value)}
            />
          </div>

          {/* Max Weight */}
          <div className="relative w-full lg:w-[140px]">
            <Input
              className="bg-card border-border text-foreground h-10"
              placeholder="Max Weight lbs"
              type="number"
              value={maxWeight}
              onChange={(e) => setMaxWeight(e.target.value)}
            />
          </div>

          {/* Mobile clear all */}
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}
              className="border-border text-muted-foreground h-10 lg:hidden">
              <X className="size-3 mr-1" /> Clear All
            </Button>
          )}
        </div>

        {/* Advanced Search toggle */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
          >
            <SlidersHorizontal className="size-3.5" />
            Location Search
            {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {advancedActive && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold">ACTIVE</span>
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-lg border"
              style={{ background: "rgba(42,223,10,0.03)", borderColor: "rgba(42,223,10,0.15)" }}>
              <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">
                Filter by Pickup Location & Radius
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Origin / Pickup City</label>
                  <CityAutocomplete
                    value={originCity}
                    onChange={(label) => {
                      setOriginCity(label)
                      // Reset coords when city changes so user must re-search
                      setOriginLat(null)
                      setOriginLng(null)
                      setAdvancedActive(false)
                    }}
                    placeholder="e.g. Dallas, TX"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Destination City (optional)</label>
                  <CityAutocomplete
                    value={destinationCity}
                    onChange={(label) => setDestinationCity(label)}
                    placeholder="e.g. Houston, TX"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Radius: <span className="text-primary font-mono font-bold">{radius} miles</span>
                  </label>
                  <input
                    type="range" min={25} max={500} step={25}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-primary mt-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    {radiusOptions.map((r) => (
                      <button key={r} onClick={() => setRadius(r)}
                        className={`px-1 rounded transition-colors ${radius === r ? "text-primary font-bold" : "hover:text-foreground"}`}>
                        {r}mi
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {advancedError && (
                <p className="text-xs text-destructive mb-3">{advancedError}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={handleAdvancedSearch} disabled={advancedLoading}
                  className="bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs h-8 hover:bg-primary/90">
                  {advancedLoading ? "Searching..." : "Search Location"}
                </Button>
                {advancedActive && (
                  <Button size="sm" variant="outline" onClick={clearAdvanced}
                    className="border-border text-muted-foreground h-8 text-xs">
                    <X className="size-3 mr-1" /> Clear Location
                  </Button>
                )}
                {advancedActive && (
                  <span className="text-xs text-muted-foreground">
                    {loads.length} load{loads.length !== 1 ? "s" : ""} found
                    {originCity && ` near ${originCity}`}
                    {radius && ` within ${radius} miles`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {equipmentFilter !== "all" && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {equipmentFilter}
                <button onClick={() => setEquipmentFilter("all")}><X className="size-3" /></button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {statusFilter}
                <button onClick={() => setStatusFilter("all")}><X className="size-3" /></button>
              </span>
            )}
            {minPay && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                Min ${minPay}
                <button onClick={() => setMinPay("")}><X className="size-3" /></button>
              </span>
            )}
            {maxPay && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                Max ${maxPay}
                <button onClick={() => setMaxPay("")}><X className="size-3" /></button>
              </span>
            )}
            {maxWeight && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                ≤ {Number(maxWeight).toLocaleString()} lbs
                <button onClick={() => setMaxWeight("")}><X className="size-3" /></button>
              </span>
            )}
            {advancedActive && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                📍 {originCity} · {radius}mi
                <button onClick={clearAdvanced}><X className="size-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Mobile stats */}
        <div className="flex lg:hidden items-center gap-3">
          <Badge className="bg-primary/15 text-primary border-0 font-mono text-xs px-2.5 py-1">
            {availableCount} Available
          </Badge>
          <Badge className="bg-muted text-muted-foreground border-0 font-mono text-xs px-2.5 py-1">
            {bookedCount} Booked
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">{loads.length} loads</span>
        </div>
      </div>

      {isLoading && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground text-sm animate-pulse">Loading loads...</p>
        </div>
      )}

      {!isLoading && loads.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {loads.map((load) => (
            <LoadCard key={load.id} load={load} onRequestLoad={(load) => { setSelectedLoad(load); setModalOpen(true) }} />
          ))}
        </div>
      )}

      {!isLoading && loads.length === 0 && (
        <div className="py-20 text-center">
          <Package className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground font-semibold">No loads match your filters</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria or{" "}
            <button onClick={clearAll} className="text-primary hover:underline">clear all filters</button>
          </p>
        </div>
      )}

      <RequestLoadModal open={modalOpen} onClose={() => setModalOpen(false)} load={selectedLoad} />
    </DashboardShell>
  )
}