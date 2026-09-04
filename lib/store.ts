import { createClient } from "@supabase/supabase-js"
import type { Load, LoadRequest, Message, EquipmentType, LoadStatus } from "@/lib/mock-data"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LoadFilters {
  search?: string
  equipmentType?: string
  status?: string
  brokerId?: string
  minPay?: number
  maxPay?: number
  maxWeight?: number
  pickupState?: string
  dropoffState?: string
}

export interface Driver {
  id: string
  dispatcher_id: string
  name: string
  company: string
  email: string
  mc_number: string
  dot_number: string
  equipment_type: string
  mc_letter_url: string
  insurance_url: string
  w9_url: string
  noa_url: string
  onboarded: boolean
  created_at?: string
}

// ── ID Generator ──────────────────────────────────────────────────────────────
function generateLoadId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const seg1 = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `LD-${seg1}-${seg2}`
}

// ── getLoads ──────────────────────────────────────────────────────────────────
export async function getLoads(filters?: LoadFilters): Promise<Load[]> {
  let query = supabase
    .from("loads")
    .select("*")
    .order("posted_at", { ascending: false })
    .range(0, 9999)

  if (filters?.brokerId) query = query.eq("broker_id", filters.brokerId)
  if (filters?.equipmentType && filters.equipmentType !== "all") query = query.eq("equipment_type", filters.equipmentType)
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status)
  if (filters?.minPay) query = query.gte("pay_rate", filters.minPay)
  if (filters?.maxPay) query = query.lte("pay_rate", filters.maxPay)
  if (filters?.maxWeight) query = query.lte("weight", filters.maxWeight)
  if (filters?.pickupState) query = query.ilike("pickup_state", `%${filters.pickupState}%`)
  if (filters?.dropoffState) query = query.ilike("dropoff_state", `%${filters.dropoffState}%`)
  if (filters?.search) {
    const q = filters.search
    query = query.or(
      `pickup_city.ilike.%${q}%,pickup_state.ilike.%${q}%,dropoff_city.ilike.%${q}%,dropoff_state.ilike.%${q}%,details.ilike.%${q}%,id.ilike.%${q}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Load[]
}

// ── getLoadById ───────────────────────────────────────────────────────────────
export async function getLoadById(id: string): Promise<Load | null> {
  const { data, error } = await supabase
    .from("loads")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Load | null
}

// ── createLoad ────────────────────────────────────────────────────────────────
export async function createLoad(data: {
  pickup_city: string
  pickup_state: string
  dropoff_city: string
  dropoff_state: string
  pickup_date?: string | null
  dropoff_date?: string | null
  equipment_type: EquipmentType
  load_type?: string | null
  total_miles?: number
  weight?: number
  pay_rate: number
  details?: string
  broker_id?: string | null
  broker_name?: string
  broker_mc?: string
  status?: LoadStatus
  posted_via_api?: boolean
  upload_source?: "manual" | "api" | "csv" | null
}): Promise<Load> {
  const id = generateLoadId()

  const { data: load, error } = await supabase
    .from("loads")
    .insert({
      id,
      pickup_city: data.pickup_city,
      pickup_state: data.pickup_state,
      dropoff_city: data.dropoff_city,
      dropoff_state: data.dropoff_state,
      pickup_date: data.pickup_date ?? null,
      dropoff_date: data.dropoff_date ?? null,
      equipment_type: data.equipment_type,
      load_type: data.load_type ?? null,
      total_miles: data.total_miles ?? 0,
      weight: data.weight ?? 0,
      pay_rate: data.pay_rate,
      details: data.details ?? "",
      broker_id: data.broker_id ?? null,
      broker_name: data.broker_name ?? "",
      broker_mc: data.broker_mc ?? "",
      status: data.status ?? "Available",
      posted_via_api: data.posted_via_api ?? false,
      upload_source: data.upload_source ?? "manual",
      posted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return load as Load
}

// ── updateLoad ────────────────────────────────────────────────────────────────
export async function updateLoad(id: string, data: Partial<Load>): Promise<Load | null> {
  const { data: load, error } = await supabase
    .from("loads")
    .update(data)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return load as Load | null
}

// ── deleteLoad ────────────────────────────────────────────────────────────────
export async function deleteLoad(id: string): Promise<void> {
  const { error } = await supabase.from("loads").delete().eq("id", id)
  if (error) throw error
}

// ── getLoadRequests ───────────────────────────────────────────────────────────
export async function getLoadRequests(filters?: {
  loadId?: string
  status?: string
  requesterId?: string
}): Promise<LoadRequest[]> {
  let query = supabase
    .from("load_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.loadId) query = query.eq("load_id", filters.loadId)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.requesterId) query = query.eq("requester_id", filters.requesterId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LoadRequest[]
}

// ── createLoadRequest ─────────────────────────────────────────────────────────
export async function createLoadRequest(data: {
  load_id: string
  requester_type: string
  requester_id?: string | null
  requester_email?: string | null
  driver_name: string
  company_name: string
  mc_number: string
  phone: string
  truck_type: string
  truck_number?: string | null
  truck_location: string
  counter_offer?: number | null
  dispatcher_name?: string
  dispatcher_phone?: string
  status?: string
}): Promise<LoadRequest> {
  const { data: req, error } = await supabase
    .from("load_requests")
    .insert({
      load_id: data.load_id,
      requester_type: data.requester_type,
      requester_id: data.requester_id ?? null,
      requester_email: data.requester_email ?? null,
      driver_name: data.driver_name,
      company_name: data.company_name,
      mc_number: data.mc_number,
      phone: data.phone,
      truck_type: data.truck_type,
      truck_number: data.truck_number ?? null,
      truck_location: data.truck_location,
      counter_offer: data.counter_offer ?? null,
      dispatcher_name: data.dispatcher_name ?? "",
      dispatcher_phone: data.dispatcher_phone ?? "",
      status: data.status ?? "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return req as LoadRequest
}

// ── updateLoadRequest ─────────────────────────────────────────────────────────
export async function updateLoadRequest(
  id: string,
  data: Partial<LoadRequest>
): Promise<LoadRequest | null> {
  const { data: req, error } = await supabase
    .from("load_requests")
    .update(data)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return req as LoadRequest | null
}

// ── getMessages ───────────────────────────────────────────────────────────────
export async function getMessages(filters?: {
  loadId?: string
  userId?: string
}): Promise<Message[]> {
  let query = supabase
    .from("messages")
    .select("*")
    .order("timestamp", { ascending: true })

  if (filters?.loadId) query = query.eq("load_id", filters.loadId)
  if (filters?.userId) query = query.or(
    `sender_id.eq.${filters.userId},recipient_id.eq.${filters.userId}`
  )

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Message[]
}

// ── createMessage ─────────────────────────────────────────────────────────────
export async function createMessage(data: {
  load_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  recipient_id?: string | null
  content: string
  message_type?: string | null
}): Promise<Message> {
  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      load_id: data.load_id,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      sender_role: data.sender_role,
      recipient_id: data.recipient_id ?? null,
      content: data.content,
      message_type: data.message_type ?? null,
      read: false,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return msg as Message
}

// ── markMessagesRead ──────────────────────────────────────────────────────────
export async function markMessagesRead(loadId: string, userId: string): Promise<void> {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("load_id", loadId)
    .neq("sender_id", userId)
}

// ── getUsers ──────────────────────────────────────────────────────────────────
export async function getUsers(filters?: {
  role?: string
  active?: boolean
}): Promise<any[]> {
  let query = supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.role) query = query.eq("role", filters.role)
  if (filters?.active !== undefined) query = query.eq("active", filters.active)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ── getUserById ───────────────────────────────────────────────────────────────
export async function getUserById(id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}

// ── getUserByEmail ────────────────────────────────────────────────────────────
export async function getUserByEmail(email: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle()
  if (error) throw error
  return data
}

// ── createUser ────────────────────────────────────────────────────────────────
export async function createUser(data: {
  name: string
  email: string
  password_hash: string
  role: string
  company_name?: string
  broker_mc?: string
  active?: boolean
  subscription_status?: string
  trial_ends_at?: string
  access_expires_at?: string
}): Promise<any> {
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      ...data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return user
}

// ── updateUser ────────────────────────────────────────────────────────────────
export async function updateUser(id: string, data: Partial<any>): Promise<any | null> {
  const { data: user, error } = await supabase
    .from("users")
    .update(data)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return user
}

// ── getDrivers ────────────────────────────────────────────────────────────────
export async function getDrivers(dispatcherId?: string): Promise<Driver[]> {
  let query = supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false })

  if (dispatcherId) query = query.eq("dispatcher_id", dispatcherId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Driver[]
}

// ── getDriverById ─────────────────────────────────────────────────────────────
export async function getDriverById(id: string): Promise<Driver | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Driver | null
}

// ── createDriver ──────────────────────────────────────────────────────────────
export async function createDriver(data: Omit<Driver, "id" | "created_at">): Promise<Driver> {
  const { data: driver, error } = await supabase
    .from("drivers")
    .insert({
      ...data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return driver as Driver
}

// ── updateDriver ──────────────────────────────────────────────────────────────
export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver | null> {
  const { data: driver, error } = await supabase
    .from("drivers")
    .update(data)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return driver as Driver | null
}

// ── getPostedTrucks ───────────────────────────────────────────────────────────
export async function getPostedTrucks(filters?: {
  carrierId?: string
  status?: string
}): Promise<any[]> {
  let query = supabase
    .from("posted_trucks")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.carrierId) query = query.eq("carrier_id", filters.carrierId)
  if (filters?.status) query = query.eq("status", filters.status)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ── createPostedTruck ─────────────────────────────────────────────────────────
export async function createPostedTruck(data: {
  carrier_id: string
  driver_name: string
  company_name: string
  mc_number: string
  equipment_type: string
  current_location: string
  phone: string
  available_date?: string | null
  notes?: string | null
}): Promise<any> {
  const { data: truck, error } = await supabase
    .from("posted_trucks")
    .insert({
      carrier_id: data.carrier_id,
      driver_name: data.driver_name,
      company_name: data.company_name,
      mc_number: data.mc_number,
      equipment_type: data.equipment_type,
      current_location: data.current_location,
      phone: data.phone,
      available_date: data.available_date ?? null,
      notes: data.notes ?? null,
      status: "available",
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return truck
}

// ── updatePostedTruck ─────────────────────────────────────────────────────────
export async function updatePostedTruck(id: string, data: Partial<any>): Promise<any | null> {
  const { data: truck, error } = await supabase
    .from("posted_trucks")
    .update(data)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return truck
}

// ── deletePostedTruck ─────────────────────────────────────────────────────────
export async function deletePostedTruck(id: string): Promise<void> {
  const { error } = await supabase.from("posted_trucks").delete().eq("id", id)
  if (error) throw error
}