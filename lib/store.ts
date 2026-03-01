import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "broker" | "dispatcher" | "carrier"
export type LoadStatus = "Available" | "Booked" | "Canceled"
export type EquipmentType = "Box Truck" | "Cargo Van" | "Sprinter Van" | "Hotshot"

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  company: string
  role: UserRole
  broker_mc: string
  active: boolean
  trial_ends_at: string | null
  created_at: string
  stripe_customer_id?: string | null
  stripe_setup_intent_id?: string | null
  email_verified?: boolean
  phone: string
}

export interface Load {
  id: string
  broker_id: string
  broker_name: string
  broker_mc: string
  pickup_city: string
  pickup_state: string
  dropoff_city: string
  dropoff_state: string
  pickup_date?: string | null
  dropoff_date?: string | null
  total_miles: number
  equipment_type: EquipmentType
  weight: number
  details: string
  pay_rate: number
  status: LoadStatus
  posted_at: string
  load_type?: string | null
}

export interface Driver {
  id: string
  dispatcher_id: string
  email: string
  name: string
  company: string
  mc_number: string
  dot_number: string
  equipment_type: string
  mc_letter_url: string
  insurance_url: string
  w9_url: string
  noa_url: string
  onboarded: boolean
  created_at: string
}

export interface Message {
  id: string
  load_id: string
  sender_id: string
  sender_name: string
  sender_role?: string
  content: string
  read: boolean
  timestamp: string
  message_type?: string | null
}

export interface LoadRequest {
  id: string
  load_id: string
  requester_type: "carrier" | "dispatcher"
  company_name: string
  driver_name: string
  mc_number: string
  phone: string
  truck_type: string
  truck_number: string
  truck_location: string
  counter_offer: number | null
  dispatcher_name: string
  dispatcher_phone: string
  status: "pending" | "accepted" | "declined"
  created_at: string
  requester_email: string
}

// ─── LOADS ───────────────────────────────────────────────────────────────────

export async function getLoads(filters?: {
  search?: string
  equipmentType?: string
  status?: string
  brokerId?: string
  minPay?: number
  maxPay?: number
  maxWeight?: number
  pickupState?: string
  dropoffState?: string
}): Promise<Load[]> {
  let query = supabase.from("loads").select("*").order("posted_at", { ascending: false })

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
  if (error) return []
  return (data ?? []) as Load[]
}
// ─── LOAD REQUESTS ───────────────────────────────────────────────────────────

export async function getLoadRequests(filters?: {
  loadId?: string
  status?: string
}): Promise<LoadRequest[]> {
  let query = supabase.from("load_requests").select("*").order("created_at", { ascending: false })
  if (filters?.loadId) query = query.eq("load_id", filters.loadId)
  if (filters?.status) query = query.eq("status", filters.status)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as LoadRequest[]
}

export async function createLoadRequest(
  data: Omit<LoadRequest, "id" | "created_at">
): Promise<LoadRequest> {
  const { data: req, error } = await supabase.from("load_requests").insert([data]).select().single()
  if (error) throw new Error(error.message)
  return req as LoadRequest
}

export async function updateLoadRequest(
  id: string,
  updates: Partial<LoadRequest>
): Promise<LoadRequest | null> {
  const { data, error } = await supabase
    .from("load_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) {
    console.error("updateLoadRequest error:", error.message)
    return null
  }
  return data as LoadRequest
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export async function getMessages(filters?: { loadId?: string }): Promise<Message[]> {
  let query = supabase.from("messages").select("*").order("timestamp", { ascending: true })
  if (filters?.loadId) query = query.eq("load_id", filters.loadId)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as Message[]
}

export async function createMessage(
  data: Omit<Message, "id" | "timestamp" | "read">
): Promise<Message> {
  const id = `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const insertData = {
    id,
    load_id: data.load_id,
    sender_id: data.sender_id,
    sender_name: data.sender_name,
    sender_role: data.sender_role || "broker",
    content: data.content,
    message_type: data.message_type || null,
    read: false,
    timestamp: new Date().toISOString(),
  }

  const { data: msg, error } = await supabase
    .from("messages")
    .insert([insertData])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return msg as Message
}

export async function markMessagesRead(loadId: string, userId: string): Promise<void> {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("load_id", loadId)
    .neq("sender_id", userId)
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function getUsers(filters?: {
  role?: string
  search?: string
}): Promise<User[]> {
  let query = supabase.from("users").select("*").order("created_at", { ascending: false })
  if (filters?.role && filters.role !== "all") query = query.eq("role", filters.role)
  if (filters?.search) {
    const q = filters.search
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as User[]
}

// ─── DRIVERS ─────────────────────────────────────────────────────────────────

export async function getDrivers(dispatcherId?: string): Promise<Driver[]> {
  let query = supabase.from("drivers").select("*").order("created_at", { ascending: false })
  if (dispatcherId) query = query.eq("dispatcher_id", dispatcherId)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as Driver[]
}

export async function updateDriver(
  id: string,
  updates: Partial<Driver>
): Promise<Driver | null> {
  const { data, error } = await supabase
    .from("drivers")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) return null
  return data as Driver
}

// ─── LOADS CRUD ──────────────────────────────────────────────────────────────

export async function getLoadById(id: string): Promise<Load | null> {
  const { data, error } = await supabase.from("loads").select("*").eq("id", id).single()
  if (error) return null
  return data as Load
}

export async function createLoad(data: Omit<Load, "id" | "posted_at">): Promise<Load> {
  const id = `LD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const insertData = {
    ...data,
    id,
    posted_at: new Date().toISOString(),
  }

  const { data: load, error } = await supabase
    .from("loads")
    .insert([insertData])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return load as Load
}

export async function updateLoad(id: string, updates: Partial<Load>): Promise<Load | null> {
  const { data, error } = await supabase.from("loads").update(updates).eq("id", id).select().single()
  if (error) return null
  return data as Load
}

export async function deleteLoad(id: string): Promise<boolean> {
  const { error } = await supabase.from("loads").delete().eq("id", id)
  return !error
}

// ─── USERS CRUD ──────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single()
  if (error) return null
  return data as User
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single()
  if (error) return null
  return data as User
}

export async function createUser(data: Omit<User, "id" | "created_at">): Promise<User> {
  const { data: user, error } = await supabase.from("users").insert([data]).select().single()
  if (error) throw new Error(error.message)
  return user as User
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single()
  if (error) return null
  return data as User
}

// ─── DRIVERS CRUD ────────────────────────────────────────────────────────────

export async function getDriverById(id: string): Promise<Driver | null> {
  const { data, error } = await supabase.from("drivers").select("*").eq("id", id).single()
  if (error) return null
  return data as Driver
}

export async function createDriver(data: Omit<Driver, "id" | "created_at">): Promise<Driver> {
  const { data: driver, error } = await supabase.from("drivers").insert([data]).select().single()
  if (error) throw new Error(error.message)
  return driver as Driver
}