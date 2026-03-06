import { NextRequest, NextResponse } from "next/server"
import { getLoads, createLoad, supabase } from "@/lib/store"
import type { LoadStatus, EquipmentType } from "@/lib/mock-data"
import { checkInternalSecret } from "@/lib/api-auth"
import { createHash } from "crypto"

// ── Rate limiting (in-memory) ──
const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 100
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(keyId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(keyId)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(keyId, { count: 1, reset: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Authenticate API key from Authorization header ──
async function authenticateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const rawKey = authHeader.replace("Bearer ", "").trim()
  if (!rawKey.startsWith("bxl_live_")) return null

  const keyHash = createHash("sha256").update(rawKey).digest("hex")

  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("active", true)
    .maybeSingle()

  if (!keyRecord) return null

  if (!checkRateLimit(keyRecord.id)) return "rate_limited"

  await supabase
    .from("api_keys")
    .update({
      last_used_at: new Date().toISOString(),
      total_requests: (keyRecord.total_requests || 0) + 1,
    })
    .eq("id", keyRecord.id)

  return keyRecord
}

// ── GET /api/loads — internal dashboard use ──
export async function GET(request: NextRequest) {
  const authError = checkInternalSecret(request)
  if (authError) return authError

  try {
    const { searchParams } = request.nextUrl
    const loads = await getLoads({
      search: searchParams.get("search") || undefined,
      equipmentType: searchParams.get("equipmentType") || undefined,
      status: searchParams.get("status") || undefined,
      brokerId: searchParams.get("brokerId") || undefined,
      minPay: searchParams.get("minPay") ? Number(searchParams.get("minPay")) : undefined,
      maxPay: searchParams.get("maxPay") ? Number(searchParams.get("maxPay")) : undefined,
      maxWeight: searchParams.get("maxWeight") ? Number(searchParams.get("maxWeight")) : undefined,
      pickupState: searchParams.get("pickupState") || undefined,
      dropoffState: searchParams.get("dropoffState") || undefined,
    })
    return NextResponse.json(loads)
  } catch (err) {
    console.error("GET /api/loads error:", err)
    return NextResponse.json({ error: "Failed to fetch loads" }, { status: 500 })
  }
}

// ── POST /api/loads — internal dashboard OR external API key ──
export async function POST(request: NextRequest) {
  // Check if this is an external API key request
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer bxl_live_")) {
    const keyRecord = await authenticateApiKey(request)
    if (!keyRecord) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
    if (keyRecord === "rate_limited") return NextResponse.json({ error: "Rate limit exceeded. Max 100 requests/hour." }, { status: 429 })
    if (!keyRecord.can_post) return NextResponse.json({ error: "This key does not have post permission" }, { status: 403 })

    try {
      const body = await request.json()
      const {
        pickup_city, pickup_state, dropoff_city, dropoff_state,
        equipment_type, pay_rate, total_miles,
        pickup_date, dropoff_date, weight, notes,
      } = body

      if (!pickup_city || !pickup_state || !dropoff_city || !dropoff_state || !equipment_type || !pay_rate) {
        return NextResponse.json({
          error: "Missing required fields: pickup_city, pickup_state, dropoff_city, dropoff_state, equipment_type, pay_rate"
        }, { status: 400 })
      }

      const load = await createLoad({
        pickup_city,
        pickup_state,
        dropoff_city,
        dropoff_state,
        pickup_date: pickup_date || null,
        dropoff_date: dropoff_date || null,
        total_miles: total_miles ? Number(total_miles) : 0,
        equipment_type: equipment_type as EquipmentType,
        load_type: null,
        weight: weight ? Number(weight) : 0,
        details: notes || "",
        pay_rate: Number(pay_rate),
        broker_mc: keyRecord.mc_number,
        broker_id: null as any,
        broker_name: keyRecord.company_name,
        status: "Available" as LoadStatus,
      })

      // Mark as posted via API
      await supabase.from("loads").update({ posted_via_api: true }).eq("id", load.id)

      

      return NextResponse.json({ success: true, load_id: load.id, load }, { status: 201 })
    } catch (err) {
      console.error("API POST /loads error:", err)
      return NextResponse.json({ error: "Failed to create load" }, { status: 500 })
    }
  }

  // Internal dashboard POST — original logic unchanged
  try {
    const body = await request.json()
    const {
      pickupCity, pickup_city,
      pickupState, pickup_state,
      dropoffCity, dropoff_city,
      dropoffState, dropoff_state,
      totalMiles, total_miles,
      equipmentType, equipment_type,
      load_type,
      weight, details, payRate, pay_rate,
      brokerMC, broker_mc,
      brokerId, broker_id,
      brokerName, broker_name,
      pickup_date,
      dropoff_date,
    } = body as any

    const resolvedPickupCity = pickupCity || pickup_city
    const resolvedDropoffCity = dropoffCity || dropoff_city
    const resolvedEquipmentType = equipmentType || equipment_type
    const resolvedPayRate = payRate || pay_rate

    if (!resolvedPickupCity || !resolvedDropoffCity || !resolvedEquipmentType || !resolvedPayRate) {
      return NextResponse.json({
        error: "Missing required fields",
        received: { resolvedPickupCity, resolvedDropoffCity, resolvedEquipmentType, resolvedPayRate }
      }, { status: 400 })
    }

    const load = await createLoad({
      pickup_city: resolvedPickupCity,
      pickup_state: pickupState || pickup_state || "",
      dropoff_city: resolvedDropoffCity,
      dropoff_state: dropoffState || dropoff_state || "",
      pickup_date: pickup_date || null,
      dropoff_date: dropoff_date || null,
      total_miles: totalMiles || total_miles || 0,
      equipment_type: resolvedEquipmentType as EquipmentType,
      load_type: load_type || null,
      weight: weight || 0,
      details: details || "",
      pay_rate: resolvedPayRate,
      broker_mc: brokerMC || broker_mc || "",
      broker_id: brokerId || broker_id || null,
      broker_name: brokerName || broker_name || "",
      status: "Available" as LoadStatus,
    })

    return NextResponse.json(load, { status: 201 })
  } catch (err) {
    console.error("POST /api/loads error:", err)
    return NextResponse.json({ error: "Invalid request body", detail: String(err) }, { status: 400 })
  }
}

// ── PATCH /api/loads — external API key only ──
export async function PATCH(request: NextRequest) {
  const keyRecord = await authenticateApiKey(request)
  if (!keyRecord) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
  if (keyRecord === "rate_limited") return NextResponse.json({ error: "Rate limit exceeded. Max 100 requests/hour." }, { status: 429 })
  if (!keyRecord.can_update) return NextResponse.json({ error: "This key does not have update permission" }, { status: 403 })

  try {
    const body = await request.json()
    const { load_id, ...updates } = body

    if (!load_id) return NextResponse.json({ error: "load_id is required" }, { status: 400 })

    const { data: existing } = await supabase
      .from("loads")
      .select("id, broker_mc")
      .eq("id", load_id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: "Load not found" }, { status: 404 })
    if (existing.broker_mc !== keyRecord.mc_number) {
      return NextResponse.json({ error: "You do not have permission to update this load" }, { status: 403 })
    }

    const allowed = ["pickup_city", "pickup_state", "dropoff_city", "dropoff_state",
      "equipment_type", "pay_rate", "total_miles", "pickup_date", "dropoff_date",
      "weight", "details", "status"]
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    )

    const { data, error } = await supabase
      .from("loads")
      .update(safeUpdates)
      .eq("id", load_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, load: data })
  } catch (err) {
    console.error("API PATCH /loads error:", err)
    return NextResponse.json({ error: "Failed to update load" }, { status: 500 })
  }
}

// ── DELETE /api/loads — external API key only ──
export async function DELETE(request: NextRequest) {
  const keyRecord = await authenticateApiKey(request)
  if (!keyRecord) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 })
  if (keyRecord === "rate_limited") return NextResponse.json({ error: "Rate limit exceeded. Max 100 requests/hour." }, { status: 429 })
  if (!keyRecord.can_delete) return NextResponse.json({ error: "This key does not have delete permission" }, { status: 403 })

  try {
    const { load_id } = await request.json()
    if (!load_id) return NextResponse.json({ error: "load_id is required" }, { status: 400 })

    const { data: existing } = await supabase
      .from("loads")
      .select("id, broker_mc")
      .eq("id", load_id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: "Load not found" }, { status: 404 })
    if (existing.broker_mc !== keyRecord.mc_number) {
      return NextResponse.json({ error: "You do not have permission to delete this load" }, { status: 403 })
    }

    const { error } = await supabase.from("loads").delete().eq("id", load_id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("API DELETE /loads error:", err)
    return NextResponse.json({ error: "Failed to delete load" }, { status: 500 })
  }
}