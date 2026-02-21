"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Users,
  Menu,
  X,
  Shield,
  Send,
  UserCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/mock-data"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Overview", href: "/admin", icon: <LayoutDashboard className="size-5" /> },
    { label: "Load Board", href: "/loadboard", icon: <Package className="size-5" /> },
  ],
  broker: [
    { label: "Dashboard", href: "/broker", icon: <LayoutDashboard className="size-5" /> },
    { label: "Load Board", href: "/loadboard", icon: <Package className="size-5" /> },
  ],
  dispatcher: [
    { label: "Dashboard", href: "/dispatcher", icon: <LayoutDashboard className="size-5" /> },
    { label: "Load Board", href: "/loadboard", icon: <Package className="size-5" /> },
  ],
  carrier: [
    { label: "Dashboard", href: "/carrier", icon: <LayoutDashboard className="size-5" /> },
    { label: "Load Board", href: "/loadboard", icon: <Package className="size-5" /> },
  ],
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <Shield className="size-4" />,
  broker: <Send className="size-4" />,
  dispatcher: <Users className="size-4" />,
  carrier: <UserCircle className="size-4" />,
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  broker: "Broker",
  dispatcher: "Dispatcher",
  carrier: "Carrier",
}

function ScanLine() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start: number | null = null
    const DURATION = 4000
    let raf: number

    const animate = (ts: number) => {
      if (!start) start = ts
      const progress = ((ts - start) % DURATION) / DURATION
      const top = 5 + progress * 90
      const opacity =
        progress < 0.1 ? progress / 0.1
        : progress > 0.85 ? (1 - progress) / 0.15
        : 0.65
      el.style.top = `${top}%`
      el.style.opacity = String(opacity)
      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: "2px",
        background: "linear-gradient(90deg, transparent 0%, rgba(57,255,20,0.7) 50%, transparent 100%)",
        boxShadow: "0 0 10px rgba(57,255,20,0.4), 0 0 20px rgba(57,255,20,0.2)",
        zIndex: 5,
        pointerEvents: "none",
        top: "5%",
        opacity: 0,
      }}
    />
  )
}

function GlitchWordmark({ size }: { size: "sidebar" | "mobile" }) {
  const redRef = useRef<HTMLDivElement>(null)
  const blueRef = useRef<HTMLDivElement>(null)
  const fontSize = size === "sidebar" ? "15px" : "18px"
  const letterSpacing = size === "sidebar" ? "2px" : "3px"

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    const scheduleGlitch = () => {
      timeout = setTimeout(() => {
        const red = redRef.current
        const blue = blueRef.current
        if (!red || !blue) return

        red.style.opacity = "1"
        red.style.transform = "translateX(2px)"
        red.style.clipPath = "polygon(0 20%, 100% 20%, 100% 45%, 0 45%)"
        setTimeout(() => {
          red.style.transform = "translateX(-1px)"
          red.style.clipPath = "polygon(0 60%, 100% 60%, 100% 80%, 0 80%)"
        }, 80)
        setTimeout(() => { red.style.opacity = "0" }, 160)

        setTimeout(() => {
          blue.style.opacity = "1"
          blue.style.transform = "translateX(-2px)"
          blue.style.clipPath = "polygon(0 40%, 100% 40%, 100% 58%, 0 58%)"
          setTimeout(() => {
            blue.style.transform = "translateX(1px)"
            blue.style.clipPath = "polygon(0 10%, 100% 10%, 100% 28%, 0 28%)"
          }, 80)
          setTimeout(() => { blue.style.opacity = "0" }, 160)
        }, 40)

        scheduleGlitch()
      }, 3200 + Math.random() * 800)
    }

    const init = setTimeout(scheduleGlitch, 2000)
    return () => {
      clearTimeout(init)
      clearTimeout(timeout)
    }
  }, [])

  const ghostStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    fontFamily: "var(--font-audiowide), sans-serif",
    fontSize,
    letterSpacing,
    pointerEvents: "none",
    opacity: 0,
    whiteSpace: "nowrap",
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div ref={redRef} style={{ ...ghostStyle, color: "rgba(255,40,40,0.3)" }}>BOXALOO</div>
      <div ref={blueRef} style={{ ...ghostStyle, color: "rgba(0,240,255,0.25)" }}>BOXALOO</div>
      <div style={{
        fontFamily: "var(--font-audiowide), sans-serif",
        fontSize,
        letterSpacing,
        color: "#fff",
        whiteSpace: "nowrap",
        position: "relative",
      }}>
        BOX
        <span style={{
          color: "#39ff14",
          textShadow: "0 0 10px rgba(57,255,20,0.9), 0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.2)",
          animation: "boxaloo-pulse 3s ease-in-out infinite",
        }}>
          ALOO
        </span>
      </div>
      <style>{`
        @keyframes boxaloo-pulse {
          0%, 100% { text-shadow: 0 0 10px rgba(57,255,20,0.9), 0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.2); }
          50% { text-shadow: 0 0 16px rgba(57,255,20,1), 0 0 32px rgba(57,255,20,0.7), 0 0 60px rgba(57,255,20,0.35); }
        }
      `}</style>
    </div>
  )
}

function LogoBlock() {
  return (
    <div style={{
      position: "relative",
      padding: "20px 24px 16px",
      borderBottom: "1px solid rgba(57,255,20,0.08)",
      overflow: "hidden",
      background: "linear-gradient(180deg, rgba(57,255,20,0.03) 0%, transparent 100%)",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        pointerEvents: "none",
        zIndex: 3,
      }} />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(57,255,20,0.05) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />
      <ScanLine />
      <div style={{
        fontFamily: "var(--font-dm-mono), monospace",
        fontSize: "7px",
        color: "rgba(57,255,20,0.25)",
        letterSpacing: "3px",
        textTransform: "uppercase",
        marginBottom: "8px",
        position: "relative",
        zIndex: 4,
      }}>
        &gt; Online
      </div>
      <div style={{ position: "relative", zIndex: 4 }}>
        <GlitchWordmark size="sidebar" />
      </div>
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "10%",
        right: "10%",
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.3), transparent)",
      }} />
    </div>
  )
}

export function DashboardNav({
  role,
  unreadCount = 0,
}: {
  role?: UserRole
  unreadCount?: number
}) {
  const [resolvedRole, setResolvedRole] = useState<UserRole>(role ?? "carrier")
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem("boxaloo_user")
    if (stored) {
      const user = JSON.parse(stored)
      setResolvedRole(user.role as UserRole)
    } else if (role) {
      setResolvedRole(role)
    }
  }, [role])

  const items = navByRole[resolvedRole] ?? navByRole["carrier"]

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    sessionStorage.removeItem("boxaloo_user")
    router.push("/")
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0"
        style={{ background: "#040407", borderRight: "1px solid rgba(57,255,20,0.06)" }}
      >
        <LogoBlock />

        {/* Role badge */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
          <span className="flex items-center gap-1.5 rounded-md bg-primary/10 text-primary text-xs font-semibold px-2 py-1 uppercase tracking-wider">
            {roleIcons[resolvedRole]} {roleLabels[resolvedRole]}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                style={active ? {
                  background: "rgba(57,255,20,0.06)",
                  borderLeft: "2px solid #39ff14",
                } : {}}
              >
                {item.icon}
                {item.label}
                {item.label === "Messages" && unreadCount > 0 && (
                  <span className="ml-auto flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(57,255,20,0.06)" }}>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "#040407", borderBottom: "1px solid rgba(57,255,20,0.08)" }}
      >
        <GlitchWordmark size="mobile" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-foreground"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 pt-16"
          style={{ background: "#040407" }}
        >
          <nav className="flex flex-col gap-1 p-4">
            {items.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={active ? {
                    background: "rgba(57,255,20,0.06)",
                    borderLeft: "2px solid #39ff14",
                  } : {}}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="mt-4 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </>
  )
}

export function DashboardShell({
  role,
  children,
  unreadCount = 0,
}: {
  role?: UserRole
  children: React.ReactNode
  unreadCount?: number
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav role={role} unreadCount={unreadCount} />
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}