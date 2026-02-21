"use client"

import { MapPin, ArrowRight, Truck, Weight, DollarSign, Clock, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Load } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"

function getField(load: any, camel: string, snake: string) {
  return load[camel] ?? load[snake] ?? ""
}

export function LoadCard({
  load,
  onRequestLoad,
  showActions = true,
}: {
  load: Load
  onRequestLoad?: (load: Load) => void
  showActions?: boolean
}) {
  const isAvailable = load.status === "Available"
  const isCanceled = load.status === "Canceled"

  const pickupCity = getField(load, "pickupCity", "pickup_city")
  const pickupState = getField(load, "pickupState", "pickup_state")
  const dropoffCity = getField(load, "dropoffCity", "dropoff_city")
  const dropoffState = getField(load, "dropoffState", "dropoff_state")
  const totalMiles = getField(load, "totalMiles", "total_miles")
  const equipmentType = getField(load, "equipmentType", "equipment_type")
  const payRate = getField(load, "payRate", "pay_rate")
  const brokerMC = getField(load, "brokerMC", "broker_mc")
  const brokerId = getField(load, "brokerId", "broker_id")
  const postedAt = getField(load, "postedAt", "posted_at")
  const pickupDate = getField(load, "pickupDate", "pickup_date")
  const dropoffDate = getField(load, "dropoffDate", "dropoff_date")
  const weight = load.weight ?? 0

  const formatDate = (d: string) => {
    if (!d) return null
    try { return format(new Date(d), "MMM d") } catch { return null }
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-border bg-card p-4 lg:p-5 transition-all duration-300",
        !isCanceled && "hover:border-primary/30 hover:shadow-[0_0_20px_rgba(77,254,132,0.05)]",
        isCanceled && "opacity-60",
        "animate-in fade-in slide-in-from-bottom-2 duration-500"
      )}
    >
      {/* Status + ID */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 border-0",
                  isAvailable
                    ? "bg-primary/15 text-primary animate-pulse"
                    : isCanceled
                    ? "bg-destructive/15 text-destructive"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {load.status}
              </Badge>
              {getField(load, "loadType", "load_type") && (
                <Badge className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 border-0 bg-blue-500/15 text-blue-400">
                  {getField(load, "loadType", "load_type")}
                </Badge>
              )}
              <span className="text-xs font-mono text-muted-foreground">{load.id}</span>
            </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {postedAt ? formatDistanceToNow(new Date(postedAt), { addSuffix: true }) : "—"}
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground text-sm lg:text-base">
            {pickupCity}, {pickupState}
          </span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5">
          <MapPin className="size-4 text-destructive shrink-0" />
          <span className="font-semibold text-foreground text-sm lg:text-base">
            {dropoffCity}, {dropoffState}
          </span>
        </div>
      </div>

      {/* Dates */}
      {(pickupDate || dropoffDate) && (
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <Calendar className="size-3 shrink-0" />
          {pickupDate && <span>Pickup: <span className="text-foreground font-medium">{formatDate(pickupDate)}</span></span>}
          {pickupDate && dropoffDate && <span className="text-border">·</span>}
          {dropoffDate && <span>Dropoff: <span className="text-foreground font-medium">{formatDate(dropoffDate)}</span></span>}
        </div>
      )}

      {/* Data grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Truck className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{equipmentType}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {Number(totalMiles).toLocaleString()} mi
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Weight className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            {Number(weight).toLocaleString()} lbs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="size-3.5 text-primary" />
          <span className="font-mono text-sm font-bold text-primary">
            ${Number(payRate).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Details */}
      {load.details && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{load.details}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-muted-foreground">
          {brokerMC}
        </span>
        {showActions && !isCanceled && (
          <Button
            size="sm"
            onClick={() => onRequestLoad?.(load)}
            disabled={!isAvailable}
            className={cn(
              "text-xs font-bold uppercase tracking-wider h-8",
              isAvailable
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isAvailable ? "Request Load" : "Booked"}
          </Button>
        )}
        {showActions && isCanceled && (
          <Badge className="bg-destructive/15 text-destructive border-0 text-[10px] font-bold uppercase">
            Canceled
          </Badge>
        )}
      </div>
    </div>
  )
}