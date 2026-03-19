"use client"

import type React from "react"

import { useMemo, useRef, useState } from "react"
import { Loader2, MapPin, Move, Search } from "lucide-react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

import { cn } from "@/lib/utils"

interface CoordinateSelection {
  latitude: number
  longitude: number
}

interface LocationCanvasProps {
  location?: string
  coordinates?: string
  query: string
  latitude?: number | null
  longitude?: number | null
  isLoading?: boolean
  className?: string
  onQueryChange: (value: string) => void
  onCoordinateSelect?: (selection: CoordinateSelection) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function mapPointFromClientPosition(clientX: number, clientY: number, element: HTMLDivElement) {
  const rect = element.getBoundingClientRect()
  const ratioX = clamp((clientX - rect.left) / rect.width, 0, 1)
  const ratioY = clamp((clientY - rect.top) / rect.height, 0, 1)

  return {
    latitude: Number((((1 - ratioY) * 180) - 90).toFixed(4)),
    longitude: Number(((ratioX * 360) - 180).toFixed(4)),
  }
}

function toMarkerPosition(latitude?: number | null, longitude?: number | null) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { left: 56, top: 40 }
  }

  return {
    left: clamp(((longitude + 180) / 360) * 100, 0, 100),
    top: clamp(((90 - latitude) / 180) * 100, 0, 100),
  }
}

function formatHoverCoordinates(selection: CoordinateSelection | null) {
  if (!selection) {
    return "Tap or click on the map to pin a custom point."
  }

  const ns = selection.latitude >= 0 ? "N" : "S"
  const ew = selection.longitude >= 0 ? "E" : "W"
  return `${Math.abs(selection.latitude).toFixed(2)} ${ns}, ${Math.abs(selection.longitude).toFixed(2)} ${ew}`
}

export function LocationCanvas({
  location = "Waiting for location",
  coordinates = "Coordinates appear after the first estimate run.",
  query,
  latitude,
  longitude,
  isLoading = false,
  className,
  onQueryChange,
  onCoordinateSelect,
}: LocationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [hoverPoint, setHoverPoint] = useState<CoordinateSelection | null>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-80, 80], [5, -5])
  const rotateY = useTransform(mouseX, [-80, 80], [-6, 6])
  const springRotateX = useSpring(rotateX, { stiffness: 260, damping: 24 })
  const springRotateY = useSpring(rotateY, { stiffness: 260, damping: 24 })
  const marker = useMemo(() => toMarkerPosition(latitude, longitude), [latitude, longitude])

  const updateTiltFromPointer = (clientX: number, clientY: number) => {
    if (!containerRef.current) {
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(clientX - (rect.left + rect.width / 2))
    mouseY.set(clientY - (rect.top + rect.height / 2))
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") {
      return
    }

    updateTiltFromPointer(event.clientX, event.clientY)
  }

  const handlePointerLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setHoverPoint(null)
  }

  const handleMapPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mapRef.current) {
      return
    }

    setHoverPoint(mapPointFromClientPosition(event.clientX, event.clientY, mapRef.current))
  }

  const handleMapPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mapRef.current || !onCoordinateSelect) {
      return
    }

    const selection = mapPointFromClientPosition(event.clientX, event.clientY, mapRef.current)
    setHoverPoint(selection)
    onCoordinateSelect(selection)
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ perspective: 1200 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,rgba(17,24,39,0.98),rgba(5,10,20,0.94))] p-4 shadow-[0_28px_90px_-44px_rgba(14,165,233,0.55)] sm:rounded-[30px] sm:p-5"
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%)]" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/90">
                <MapPin className="h-3.5 w-3.5" />
                Location canvas
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight text-white sm:text-lg">{location}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-400">{coordinates}</p>
              </div>
            </div>

            <div className="self-start rounded-full bg-white/6 px-3 py-1 text-[11px] font-medium text-slate-300">
              {isLoading ? "Resolving..." : "Interactive"}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-[22px] bg-white/6 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-full">
            <Search className="h-4 w-4 text-sky-200" />
            <input
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search a city or enter latitude, longitude"
              className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-slate-500"
            />
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : null}
          </label>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div
              ref={mapRef}
              className="group relative h-[220px] cursor-crosshair overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,rgba(8,16,29,0.88),rgba(3,8,17,0.98))] sm:h-[260px] sm:rounded-[26px]"
              onPointerMove={handleMapPointerMove}
              onPointerDown={handleMapPointerDown}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(14,165,233,0.2),transparent_26%),radial-gradient(circle_at_70%_20%,rgba(125,211,252,0.18),transparent_22%),radial-gradient(circle_at_78%_72%,rgba(59,130,246,0.2),transparent_24%)]" />

              {[16, 33, 50, 67, 84].map((top) => (
                <div key={`lat-${top}`} className="absolute left-0 right-0 h-px bg-white/6" style={{ top: `${top}%` }} />
              ))}
              {[20, 40, 60, 80].map((left) => (
                <div key={`lon-${left}`} className="absolute bottom-0 top-0 w-px bg-white/6" style={{ left: `${left}%` }} />
              ))}

              <div className="absolute left-[11%] top-[22%] h-[34%] w-[31%] rounded-[48%] bg-sky-300/10 blur-[1px]" />
              <div className="absolute left-[24%] top-[35%] h-[22%] w-[16%] rounded-[44%] bg-slate-200/6" />
              <div className="absolute left-[53%] top-[19%] h-[18%] w-[15%] rounded-[44%] bg-slate-200/6" />
              <div className="absolute left-[57%] top-[38%] h-[26%] w-[22%] rounded-[46%] bg-sky-200/10" />
              <div className="absolute left-[72%] top-[62%] h-[12%] w-[10%] rounded-[48%] bg-slate-100/6" />
              <div className="absolute left-[42%] top-[66%] h-[16%] w-[18%] rounded-[48%] bg-sky-400/10" />

              <motion.div
                className="absolute z-10"
                animate={{
                  left: `${marker.left}%`,
                  top: `${marker.top}%`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                style={{ translateX: "-50%", translateY: "-50%" }}
              >
                <div className="absolute inset-0 rounded-full bg-sky-300/40 blur-xl" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#7dd3fc,#2563eb)] shadow-[0_16px_40px_-18px_rgba(96,165,250,0.9)]">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </motion.div>

              <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-full bg-slate-950/55 px-3 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-md sm:text-[11px]">
                  Tap or click to pin a custom point
                </div>
                <div className="rounded-full bg-slate-950/55 px-3 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-md sm:text-[11px]">
                  {formatHoverCoordinates(hoverPoint)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[20px] bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-[24px]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <Move className="h-4 w-4 text-sky-200" />
                  How to use it
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                  <p>Type a city name and press Enter to request irradiance data from Nominatim and Open-Meteo.</p>
                  <p>Tap or click on the map to replace the search query with exact coordinates for custom site studies.</p>
                </div>
              </div>

              <div className="rounded-[20px] bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-[24px]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Pinned output</div>
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-white">{location}</p>
                  <p className="text-sm leading-6 text-slate-300">{coordinates}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
