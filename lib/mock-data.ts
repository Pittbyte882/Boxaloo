export type EquipmentType = "Box Truck" | "Cargo Van" | "Sprinter Van" | "Hotshot"
export type LoadStatus = "Available" | "Booked" | "Canceled"
export type UserRole = "admin" | "broker" | "dispatcher" | "carrier"

export interface Load {
  id: string
  // camelCase (mock data)
  pickupCity?: string
  pickupState?: string
  dropoffCity?: string
  dropoffState?: string
  pickupDate?: string
  dropoffDate?: string
  totalMiles?: number
  equipmentType?: EquipmentType
  payRate?: number
  brokerMC?: string
  brokerId?: string
  brokerName?: string
  postedAt?: string
  loadType?: string | null
  // snake_case (Supabase)
  pickup_city?: string
  pickup_state?: string
  dropoff_city?: string
  dropoff_state?: string
  pickup_date?: string
  dropoff_date?: string
  total_miles?: number
  equipment_type?: EquipmentType
  pay_rate?: number
  broker_mc?: string
  broker_id?: string
  broker_name?: string
  posted_at?: string
  load_type?: string | null
  // shared
  weight?: number
  details?: string
  status: LoadStatus
}
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  company: string
  active: boolean
  createdAt: string
  brokerMC?: string
  dispatcherId?: string
  mc?: string
  dot?: string
}

export interface Message {
  id: string
  loadId?: string
  load_id?: string
  senderId?: string
  sender_id?: string
  senderName?: string
  sender_name?: string
  senderRole?: "broker" | "carrier" | "dispatcher"
  sender_role?: "broker" | "carrier" | "dispatcher"
  content: string
  timestamp: string
  read: boolean
  message_type?: string
}

export interface Driver {
  id: string
  name: string
  company: string
  mc: string
  dot: string
  equipmentType: EquipmentType
  phone: string
  email: string
  documents: {
    mcLetter: "uploaded" | "pending"
    insurance: "uploaded" | "pending"
    w9: "uploaded" | "pending"
    noticeOfAssignment: "uploaded" | "pending" | "optional"
  }
}

export interface LoadRequest {
  id: string
  loadId?: string
  load_id?: string
  type?: "dispatcher" | "carrier"
  requester_type?: "dispatcher" | "carrier"
  dispatcherName?: string
  dispatcher_name?: string
  dispatcherPhone?: string
  dispatcher_phone?: string
  driverName?: string
  driver_name?: string
  companyName?: string
  company_name?: string
  mc?: string
  mc_number?: string
  phone?: string
  truckType?: EquipmentType
  truck_type?: string
  truckNumber?: string
  truck_number?: string
  currentLocation?: string
  truck_location?: string
  counterOfferPrice?: number
  counter_offer?: number | null
  status: "pending" | "accepted" | "declined" | "rejected"
  createdAt?: string
  created_at?: string
  requester_email?: string
}
const cities = [
  { city: "Atlanta", state: "GA" },
  { city: "Dallas", state: "TX" },
  { city: "Chicago", state: "IL" },
  { city: "Miami", state: "FL" },
  { city: "Houston", state: "TX" },
  { city: "Phoenix", state: "AZ" },
  { city: "Los Angeles", state: "CA" },
  { city: "Denver", state: "CO" },
  { city: "Charlotte", state: "NC" },
  { city: "Nashville", state: "TN" },
  { city: "Orlando", state: "FL" },
  { city: "Memphis", state: "TN" },
  { city: "Kansas City", state: "MO" },
  { city: "Indianapolis", state: "IN" },
  { city: "Columbus", state: "OH" },
  { city: "San Antonio", state: "TX" },
  { city: "Jacksonville", state: "FL" },
  { city: "Raleigh", state: "NC" },
  { city: "Tampa", state: "FL" },
  { city: "St. Louis", state: "MO" },
]

const equipmentTypes: EquipmentType[] = ["Box Truck", "Cargo Van", "Sprinter Van", "Hotshot"]

const loadDescriptions = [
  "Palletized electronics - fragile, no stack",
  "Auto parts - 8 pallets, shrink-wrapped",
  "Medical supplies - temperature controlled preferred",
  "Retail merchandise - seasonal goods, priority delivery",
  "Construction materials - heavy, flatbed okay",
  "Food grade products - dry goods, no refrigeration needed",
  "Furniture delivery - liftgate required at destination",
  "E-commerce returns - mixed SKUs, multiple boxes",
  "Industrial equipment - 2 crates, forklift on site",
  "Household goods - blanket wrapped, residential delivery",
  "Printing supplies - palletized, dock-to-dock",
  "Pharmaceutical samples - MUST be climate stable",
  "Trade show materials - expo booth + displays",
  "Restaurant equipment - commercial kitchen install",
  "Gym equipment - 6 pallets, appointment required",
]

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateLoads(count: number): Load[] {
  const loads: Load[] = []
  for (let i = 0; i < count; i++) {
    const pickup = getRandomItem(cities)
    let dropoff = getRandomItem(cities)
    while (dropoff.city === pickup.city) {
      dropoff = getRandomItem(cities)
    }
    const miles = Math.floor(Math.random() * 1200) + 100
    const isAvailable = Math.random() > 0.25
    loads.push({
      id: `LD-${String(1000 + i).padStart(5, "0")}`,
      pickupCity: pickup.city,
      pickupState: pickup.state,
      dropoffCity: dropoff.city,
      dropoffState: dropoff.state,
      totalMiles: miles,
      equipmentType: getRandomItem(equipmentTypes),
      weight: Math.floor(Math.random() * 40000) + 2000,
      details: getRandomItem(loadDescriptions),
      payRate: Math.floor(miles * (Math.random() * 1.5 + 1.5)),
      brokerMC: `MC-${Math.floor(Math.random() * 900000) + 100000}`,
      brokerId: `BK-${String(100 + (i % 8)).padStart(4, "0")}`,
      brokerName: getRandomItem(["Swift Logistics", "Peak Freight Co", "National Express", "Priority Haul", "Apex Carriers", "Route One Logistics", "Summit Transport", "Guardian Freight"]),
      status: isAvailable ? "Available" : "Booked",
      postedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 2)).toISOString(),
    })
  }
  return loads
}

export const mockLoads: Load[] = generateLoads(30)

export const mockUsers: User[] = [
  { id: "USR-001", name: "Admin User", email: "admin@boxaloo.com", role: "admin", company: "Boxaloo", active: true, createdAt: "2025-01-01T00:00:00Z" },
  { id: "USR-002", name: "Marcus Bell", email: "marcus@swiftlogistics.com", role: "broker", company: "Swift Logistics", active: true, createdAt: "2025-02-15T00:00:00Z", brokerMC: "MC-445291" },
  { id: "USR-003", name: "Rachel Torres", email: "rachel@peakfreight.com", role: "broker", company: "Peak Freight Co", active: true, createdAt: "2025-03-01T00:00:00Z", brokerMC: "MC-332187" },
  { id: "USR-004", name: "James Walker", email: "james@apexdispatch.com", role: "dispatcher", company: "Apex Dispatch", active: true, createdAt: "2025-04-10T00:00:00Z", dispatcherId: "DSP-001" },
  { id: "USR-005", name: "Nina Patel", email: "nina@elitecarriers.com", role: "carrier", company: "Elite Carriers LLC", active: true, createdAt: "2025-05-22T00:00:00Z", mc: "MC-889922", dot: "DOT-3341982" },
  { id: "USR-006", name: "David Kim", email: "david@kimtransport.com", role: "carrier", company: "Kim Transport", active: false, createdAt: "2025-06-01T00:00:00Z", mc: "MC-112233", dot: "DOT-1122111" },
  { id: "USR-007", name: "Sara Johnson", email: "sara@nationalexp.com", role: "broker", company: "National Express", active: true, createdAt: "2025-03-15T00:00:00Z", brokerMC: "MC-556677" },
  { id: "USR-008", name: "Mike Rodriguez", email: "mike@reddispatch.com", role: "dispatcher", company: "Red Dispatch Co", active: true, createdAt: "2025-07-01T00:00:00Z", dispatcherId: "DSP-002" },
]

export const mockDrivers: Driver[] = [
  { id: "DRV-001", name: "Tony Martinez", company: "Martinez Hauling", mc: "MC-334455", dot: "DOT-8872345", equipmentType: "Box Truck", phone: "(404) 555-0121", email: "tony@martinezhauling.com", documents: { mcLetter: "uploaded", insurance: "uploaded", w9: "uploaded", noticeOfAssignment: "optional" } },
  { id: "DRV-002", name: "Lisa Chang", company: "Chang Express", mc: "MC-667788", dot: "DOT-5543211", equipmentType: "Sprinter Van", phone: "(214) 555-0134", email: "lisa@changexpress.com", documents: { mcLetter: "uploaded", insurance: "uploaded", w9: "pending", noticeOfAssignment: "pending" } },
  { id: "DRV-003", name: "Omar Hassan", company: "Hassan Freight", mc: "MC-998877", dot: "DOT-7765432", equipmentType: "Cargo Van", phone: "(312) 555-0156", email: "omar@hassanfreight.com", documents: { mcLetter: "uploaded", insurance: "pending", w9: "uploaded", noticeOfAssignment: "optional" } },
]

export const mockMessages: Message[] = [
  { id: "MSG-001", loadId: "LD-01000", senderId: "USR-004", senderName: "James Walker", senderRole: "dispatcher", content: "Is this load still available? I have a driver in Atlanta ready to pick up today.", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: "MSG-002", loadId: "LD-01000", senderId: "USR-002", senderName: "Marcus Bell", senderRole: "broker", content: "Yes, still available. Can your driver be at the dock by 2PM?", timestamp: new Date(Date.now() - 3000000).toISOString(), read: true },
  { id: "MSG-003", loadId: "LD-01000", senderId: "USR-004", senderName: "James Walker", senderRole: "dispatcher", content: "Absolutely. Sending driver details now.", timestamp: new Date(Date.now() - 2400000).toISOString(), read: false },
  { id: "MSG-004", loadId: "LD-01002", senderId: "USR-005", senderName: "Nina Patel", senderRole: "carrier", content: "Can you do $1,800 on this load? I can be there first thing tomorrow.", timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
  { id: "MSG-005", loadId: "LD-01005", senderId: "USR-005", senderName: "Nina Patel", senderRole: "carrier", content: "Interested in this load. What are the delivery requirements?", timestamp: new Date(Date.now() - 1800000).toISOString(), read: false },
]

export const mockLoadRequests: LoadRequest[] = [
  { id: "REQ-001", loadId: "LD-01000", type: "dispatcher", dispatcherName: "James Walker", dispatcherPhone: "(404) 555-9988", driverName: "Tony Martinez", companyName: "Martinez Hauling", mc: "MC-334455", phone: "(404) 555-0121", truckType: "Box Truck", truckNumber: "TRK-441", currentLocation: "Atlanta, GA", status: "pending", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "REQ-002", loadId: "LD-01002", type: "carrier", driverName: "Nina Patel", companyName: "Elite Carriers LLC", mc: "MC-889922", phone: "(305) 555-0178", truckType: "Cargo Van", truckNumber: "VAN-102", currentLocation: "Miami, FL", counterOfferPrice: 1800, status: "pending", createdAt: new Date(Date.now() - 7200000).toISOString() },
]
