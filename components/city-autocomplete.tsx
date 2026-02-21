"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CityOption {
  label: string
  city: string
  state: string
}

interface CityAutocompleteProps {
  value: string
  onChange: (value: string, city: string, state: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "City, State",
  className,
  required,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [options, setOptions] = useState<CityOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setOpen(true)

    clearTimeout(debounceRef.current)
    if (val.length < 2) {
      setOptions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/here/autocomplete?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setOptions(data.items ?? [])
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function handleSelect(option: CityOption) {
    setQuery(option.label)
    setOpen(false)
    setOptions([])
    onChange(option.label, option.city, option.state)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={handleInput}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        className={cn("bg-input border-border text-foreground", className)}
        autoComplete="off"
      />

      {open && (options.length > 0 || loading) && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg overflow-hidden"
          style={{
            background: "#16161e",
            border: "1px solid rgba(42,223,10,0.15)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground font-mono">
              Searching...
            </div>
          )}
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onMouseDown={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2.5 text-sm transition-colors"
              style={{
                color: "#f0f0f5",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(42,223,10,0.08)"
                e.currentTarget.style.color = "#2adf0a"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "#f0f0f5"
              }}
            >
              <span className="font-semibold">{opt.city}</span>
              <span className="text-muted-foreground">, {opt.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}