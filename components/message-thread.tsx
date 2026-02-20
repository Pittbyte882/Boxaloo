"use client"

import { useState, useEffect, useRef } from "react"
import { Send, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/mock-data"
import { sendMessage } from "@/hooks/use-api"
import { format } from "date-fns"

interface RateCon {
  load_id: string
  pickup_city: string
  pickup_state: string
  dropoff_city: string
  dropoff_state: string
  pickup_date?: string | null
  dropoff_date?: string | null
  equipment_type: string
  weight: number
  pay_rate: number
  broker_name: string
  broker_mc: string
}

export function MessageThread({
  messages,
  currentUserId = "USR-002",
  currentUserName = "You",
  currentUserRole = "broker",
  load,
  onRateConSend,
}: {
  messages: Message[]
  currentUserId?: string
  currentUserName?: string
  currentUserRole?: "broker" | "carrier" | "dispatcher"
  load?: any
  onRateConSend?: () => void
}) {
  const [newMessage, setNewMessage] = useState("")
  const [localMessages, setLocalMessages] = useState<Message[]>(messages)
  const [showRateCon, setShowRateCon] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Sync when messages prop updates (SWR refresh)
  useEffect(() => {
  if (messages.length >= localMessages.length) {
    setLocalMessages(messages)
  }
}, [messages])
  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [localMessages])

  const loadId = messages[0]?.loadId ?? messages[0]?.load_id ?? load?.id ?? ""

  const handleSend = async (content?: string, messageType?: string) => {
    const text = content ?? newMessage.trim()
    if (!text) return

    const payload: any = {
      load_id: loadId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      content: text,
    }
    if (messageType) payload.message_type = messageType

    try {
      const msg = await sendMessage(payload)
      setLocalMessages((prev) => [...prev, msg])
    } catch {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `MSG-${Date.now()}`,
          loadId,
          load_id: loadId,
          senderId: currentUserId,
          sender_id: currentUserId,
          senderName: currentUserName,
          sender_name: currentUserName,
          senderRole: currentUserRole as any,
          sender_role: currentUserRole,
          content: text,
          timestamp: new Date().toISOString(),
          read: true,
          message_type: messageType,
        } as any,
      ])
    }
    if (!content) setNewMessage("")
  }

  const handleSendRateCon = async () => {
    if (!load) return
    const rc: RateCon = {
      load_id: load.id,
      pickup_city: load.pickup_city ?? load.pickupCity,
      pickup_state: load.pickup_state ?? load.pickupState,
      dropoff_city: load.dropoff_city ?? load.dropoffCity,
      dropoff_state: load.dropoff_state ?? load.dropoffState,
      pickup_date: load.pickup_date ?? load.pickupDate,
      dropoff_date: load.dropoff_date ?? load.dropoffDate,
      equipment_type: load.equipment_type ?? load.equipmentType,
      weight: load.weight,
      pay_rate: load.pay_rate ?? load.payRate,
      broker_name: load.broker_name ?? load.brokerName,
      broker_mc: load.broker_mc ?? load.brokerMC,
    }
    await handleSend(`__RATECON__${JSON.stringify(rc)}`, "rate_con")
    setShowRateCon(false)
    onRateConSend?.()
  }

  const renderMessage = (msg: any) => {
    const isMe = (msg.senderId ?? msg.sender_id) === currentUserId
    const name = msg.senderName ?? msg.sender_name ?? "Unknown"
    const time = msg.timestamp ? format(new Date(msg.timestamp), "h:mm a") : ""
    const content = msg.content ?? ""

    // Rate Con card
    if (content.startsWith("__RATECON__")) {
      let rc: RateCon | null = null
      try { rc = JSON.parse(content.replace("__RATECON__", "")) } catch {}
      if (rc) {
        return (
          <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "items-start")}>
            <span className="text-[10px] text-muted-foreground mb-1">{name} &middot; {time}</span>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 w-full min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="size-4 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Rate Confirmation</span>
                <Badge className="bg-primary/15 text-primary border-0 text-[10px] font-bold ml-auto">{rc.load_id}</Badge>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route</span>
                  <span className="text-foreground font-semibold">{rc.pickup_city}, {rc.pickup_state} → {rc.dropoff_city}, {rc.dropoff_state}</span>
                </div>
                {rc.pickup_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pickup Date</span>
                    <span className="text-foreground">{rc.pickup_date}</span>
                  </div>
                )}
                {rc.dropoff_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dropoff Date</span>
                    <span className="text-foreground">{rc.dropoff_date}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equipment</span>
                  <span className="text-foreground">{rc.equipment_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="text-foreground">{Number(rc.weight).toLocaleString()} lbs</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 mt-1">
                  <span className="text-muted-foreground font-semibold">Pay Rate</span>
                  <span className="text-primary font-mono font-bold text-sm">${Number(rc.pay_rate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Broker</span>
                  <span className="text-foreground">{rc.broker_name} &middot; {rc.broker_mc}</span>
                </div>
              </div>
            </div>
          </div>
        )
      }
    }

    // Regular message
    return (
      <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
        <span className="text-[10px] text-muted-foreground mb-1">{name} &middot; {time}</span>
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isMe ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"
        )}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          {localMessages.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start the conversation below</p>
            </div>
          )}
          {localMessages.map((msg) => renderMessage(msg))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Rate Con preview */}
      {showRateCon && load && (
        <div className="mx-3 mb-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase">Rate Con Preview</span>
            </div>
            <button onClick={() => setShowRateCon(false)}>
              <X className="size-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {load.pickup_city ?? load.pickupCity}, {load.pickup_state ?? load.pickupState} → {load.dropoff_city ?? load.dropoffCity}, {load.dropoff_state ?? load.dropoffState} &middot; <span className="text-primary font-mono font-bold">${(load.pay_rate ?? load.payRate ?? 0).toLocaleString()}</span>
          </p>
          <Button size="sm" onClick={handleSendRateCon} className="bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:bg-primary/90 mt-2 h-7 text-xs w-full">
            Send Rate Con
          </Button>
        </div>
      )}

      <div className="p-3 border-t border-border flex items-center gap-2">
        {currentUserRole === "broker" && load && (
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowRateCon(!showRateCon)}
            className="border-border text-primary hover:bg-primary/10 shrink-0 h-9 w-9"
            title="Send Rate Con"
          >
            <FileText className="size-4" />
          </Button>
        )}
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="bg-input border-border text-foreground"
        />
        <Button
          size="icon"
          onClick={() => handleSend()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}