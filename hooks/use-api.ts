import useSWR, { mutate } from "swr"
import type { Load, LoadRequest, Message, User, Driver } from "@/lib/mock-data"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ---------- LOADS ----------
export function useLoads(filters?: {
  search?: string
  equipmentType?: string
  status?: string
  brokerId?: string
}) {
  const params = new URLSearchParams()
  if (filters?.search) params.set("search", filters.search)
  if (filters?.equipmentType && filters.equipmentType !== "all") params.set("equipmentType", filters.equipmentType)
  if (filters?.status && filters.status !== "all") params.set("status", filters.status)
  if (filters?.brokerId) params.set("brokerId", filters.brokerId)
  const qs = params.toString()
  return useSWR<Load[]>(`/api/loads${qs ? `?${qs}` : ""}`, fetcher, {
    refreshInterval: 10000,
  })
}

export async function createLoad(data: Record<string, unknown>) {
  const res = await fetch("/api/loads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create load")
  const load = await res.json()
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/loads"))
  return load as Load
}

export async function updateLoad(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/loads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update load")
  const load = await res.json()
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/loads"))
  return load as Load
}

export async function deleteLoadApi(id: string) {
  const res = await fetch(`/api/loads/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete load")
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/loads"))
}

// ---------- LOAD REQUESTS ----------
export function useLoadRequests(filters?: { loadId?: string; status?: string }) {
  const params = new URLSearchParams()
  if (filters?.loadId) params.set("loadId", filters.loadId)
  if (filters?.status) params.set("status", filters.status)
  const qs = params.toString()
  return useSWR<LoadRequest[]>(
    `/api/requests${qs ? `?${qs}` : ""}`,
    fetcher,
    { refreshInterval: 5000 }
  )
}

export async function createLoadRequest(data: Record<string, unknown>) {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create request")
  const req = await res.json()
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/requests"))
  return req as LoadRequest
}

export async function updateLoadRequest(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update request")
  const req = await res.json()
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/requests"))
  return req as LoadRequest
}

// ---------- MESSAGES ----------
export function useMessages(loadId?: string) {
  return useSWR<Message[]>(
    loadId ? `/api/messages?loadId=${loadId}` : "/api/messages",
    fetcher,
    { refreshInterval: 5000 }
  )
}

export async function sendMessage(data: Record<string, unknown>) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to send message")
  const msg = await res.json()
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/messages"))
  return msg as Message
}

export async function markRead(loadId: string, userId: string) {
  await fetch("/api/messages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ load_id: loadId, user_id: userId }),
  })
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/messages"))
}

// ---------- USERS ----------
export function useUsers(filters?: { role?: string; search?: string }) {
  const params = new URLSearchParams()
  if (filters?.role && filters.role !== "all") params.set("role", filters.role)
  if (filters?.search) params.set("search", filters.search)
  const qs = params.toString()
  return useSWR<User[]>(`/api/users${qs ? `?${qs}` : ""}`, fetcher)
}

export async function updateUserApi(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update user")
  const user = await res.json()
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/users"))
  return user as User
}

// ---------- DRIVERS ----------
export function useDrivers(dispatcherId?: string) {
  const url = dispatcherId ? `/api/drivers?dispatcherId=${dispatcherId}` : "/api/drivers"
  return useSWR<Driver[]>(url, fetcher)
}

export async function createDriverApi(data: Record<string, unknown>) {
  const res = await fetch("/api/drivers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create driver")
  const driver = await res.json()
  mutate("/api/drivers")
  return driver as Driver
}

// ---------- AUTH ----------
export async function loginApi(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Login failed")
  return data as { user: User }
}

export async function signupApi(data: Record<string, unknown>) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  const result = await res.json()
  if (!res.ok) throw new Error(result.error || "Signup failed")
  return result as { user: User }
}

// ---------- ONBOARDING ----------
export async function submitOnboarding(data: Record<string, unknown>) {
  const res = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to submit onboarding")
  return res.json()
}