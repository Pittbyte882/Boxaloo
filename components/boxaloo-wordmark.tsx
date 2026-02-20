"use client"

import { useEffect, useRef } from "react"

export function BoxalooWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const redRef = useRef<HTMLDivElement>(null)
  const blueRef = useRef<HTMLDivElement>(null)

  const fontSize = size === "sm" ? "14px" : size === "lg" ? "24px" : "18px"
  const letterSpacing = size === "sm" ? "1px" : size === "lg" ? "4px" : "3px"

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
    return () => { clearTimeout(init); clearTimeout(timeout) }
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
      <div ref={redRef} style={{ ...ghostStyle, color: "rgba(255,40,40,0.3)" }}>
        BOXALOO
      </div>
      <div ref={blueRef} style={{ ...ghostStyle, color: "rgba(0,240,255,0.25)" }}>
        BOXALOO
      </div>
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
          0%, 100% {
            text-shadow: 0 0 10px rgba(57,255,20,0.9), 0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(57,255,20,0.2);
          }
          50% {
            text-shadow: 0 0 16px rgba(57,255,20,1), 0 0 32px rgba(57,255,20,0.7), 0 0 60px rgba(57,255,20,0.35);
          }
        }
      `}</style>
    </div>
  )
}