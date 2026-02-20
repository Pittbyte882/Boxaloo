"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EquipmentType } from "@/lib/mock-data"
import { useDrivers, createLoadRequest } from "@/hooks/use-api"

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

export function RequestLoadModal({
  open,
  onClose,
  load,
}: {
  open: boolean
  onClose: () => void
  load: any | null
}) {
  const [requestType, setRequestType] = useState<"dispatcher" | "carrier">("carrier")
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    dispatcherName: "",
    dispatcherPhone: "",
    selectedDriverId: "",
    companyName: "",
    driverName: "",
    mc: "",
    phone: "",
    truckType: "",
    truckNumber: "",
    currentLocation: "",
    counterOfferPrice: "",
  })

  const { data: drivers = [] } = useDrivers()

  if (!load) return null

  // Handle both camelCase (mock) and snake_case (Supabase)
  const loadId = load.id
  const pickupCity = load.pickupCity ?? load.pickup_city ?? ""
  const pickupState = load.pickupState ?? load.pickup_state ?? ""
  const dropoffCity = load.dropoffCity ?? load.dropoff_city ?? ""
  const dropoffState = load.dropoffState ?? load.dropoff_state ?? ""
  const payRate = load.payRate ?? load.pay_rate ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createLoadRequest({
        load_id: loadId,
        requester_type: requestType,
        driver_name: formData.driverName,
        company_name: formData.companyName,
        mc_number: formData.mc,
        phone: formData.phone,
        truck_type: formData.truckType,
        truck_number: formData.truckNumber,
        truck_location: formData.currentLocation,
        counter_offer: formData.counterOfferPrice ? Number(formData.counterOfferPrice) : null,
        dispatcher_name: requestType === "dispatcher" ? formData.dispatcherName : "",
        dispatcher_phone: requestType === "dispatcher" ? formData.dispatcherPhone : "",
        status: "pending",
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          dispatcherName: "",
          dispatcherPhone: "",
          selectedDriverId: "",
          companyName: "",
          driverName: "",
          mc: "",
          phone: "",
          truckType: "",
          truckNumber: "",
          currentLocation: "",
          counterOfferPrice: "",
        })
        onClose()
      }, 2000)
    } catch (err) {
      console.error("Failed to submit request:", err)
    }
  }

  const handleDriverSelect = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId)
    if (driver) {
      // Handle both camelCase (mock) and snake_case (Supabase)
      setFormData((p) => ({
        ...p,
        selectedDriverId: driverId,
        driverName: driver.name,
        companyName: driver.company,
        mc: (driver as any).mc ?? (driver as any).mc_number ?? "",
        phone: (driver as any).phone ?? "",
        truckType: (driver as any).equipmentType ?? (driver as any).equipment_type ?? "",
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-bold">
            Request Load {loadId}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {pickupCity}, {pickupState} → {dropoffCity}, {dropoffState} &middot; ${Number(payRate).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary text-2xl font-bold">✓</span>
            </div>
            <p className="text-foreground font-semibold">Request Submitted!</p>
            <p className="text-sm text-muted-foreground mt-1">
              The broker will review your request shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setRequestType("carrier")}
                className={
                  requestType === "carrier"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground bg-transparent hover:bg-accent"
                }
              >
                Carrier
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setRequestType("dispatcher")}
                className={
                  requestType === "dispatcher"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground bg-transparent hover:bg-accent"
                }
              >
                Dispatcher
              </Button>
            </div>

            {/* Dispatcher-only fields */}
            {requestType === "dispatcher" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5">Dispatcher Name</Label>
                    <Input
                      className="bg-input border-border text-foreground"
                      placeholder="Your name"
                      required
                      value={formData.dispatcherName}
                      onChange={(e) => setFormData((p) => ({ ...p, dispatcherName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5">Dispatcher Phone</Label>
                    <Input
                      className="bg-input border-border text-foreground"
                      placeholder="(555) 000-0000"
                      required
                      value={formData.dispatcherPhone}
                      onChange={(e) => setFormData((p) => ({ ...p, dispatcherPhone: e.target.value }))}
                    />
                  </div>
                </div>
                {drivers.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5">
                      Select Driver (optional — auto-fills fields)
                    </Label>
                    <Select value={formData.selectedDriverId} onValueChange={handleDriverSelect}>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Choose a driver" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-foreground">
                            {d.name} — {d.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {/* Shared fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Company Name</Label>
                <Input
                  className="bg-input border-border text-foreground"
                  placeholder="Company name"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Driver Name</Label>
                <Input
                  className="bg-input border-border text-foreground"
                  placeholder="Driver name"
                  required
                  value={formData.driverName}
                  onChange={(e) => setFormData((p) => ({ ...p, driverName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">MC#</Label>
                <Input
                  className="bg-input border-border text-foreground font-mono"
                  placeholder="MC-000000"
                  required
                  value={formData.mc}
                  onChange={(e) => setFormData((p) => ({ ...p, mc: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Phone</Label>
                <Input
                  className="bg-input border-border text-foreground"
                  placeholder="(555) 000-0000"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Truck Type</Label>
                <Select
                  value={formData.truckType}
                  onValueChange={(v) => setFormData((p) => ({ ...p, truckType: v }))}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {equipmentTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-foreground">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Truck #</Label>
                <Input
                  className="bg-input border-border text-foreground font-mono"
                  placeholder="TRK-000"
                  required
                  value={formData.truckNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, truckNumber: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Current Truck Location</Label>
              <Input
                className="bg-input border-border text-foreground"
                placeholder="City, State"
                required
                value={formData.currentLocation}
                onChange={(e) => setFormData((p) => ({ ...p, currentLocation: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">
                Counter Offer Price (optional)
              </Label>
              <Input
                className="bg-input border-border text-foreground font-mono"
                placeholder="$0.00"
                type="number"
                value={formData.counterOfferPrice}
                onChange={(e) => setFormData((p) => ({ ...p, counterOfferPrice: e.target.value }))}
              />
            </div>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2"
            >
              Submit Request
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}