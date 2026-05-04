import {useState, useEffect, useRef, useCallback} from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import { MOSCOW } from '@/lib/map-constants'
import { MapClickHandler, MapRecenter } from '@/lib/map-utils'
import { X, Locate, Search, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode } from '@/lib/geo'
import { useAddressSuggestions } from '@/hooks/use-address-suggestions'
import { useApplyPoint } from '@/hooks/use-apply-point'
import { useMapHandlers } from '@/hooks/use-map-handlers'
import { cn } from '@/lib/utils'

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#52796f;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const SERVICE_RADIUS_OPTIONS = [500, 1000, 2000, 3000, 5000, 10000, 20000]

function formatMeters(m: number): string {
  return m >= 1000 ? `${m / 1000} км` : `${m} м`
}

interface ShopLocationModalProps {
  initialLat: number | null
  initialLng: number | null
  initialRadiusMeters: number | null
  onClose: () => void
  onSave: (lat: number, lng: number, radiusMeters: number | null, label: string) => void
}

export function ShopLocationModal({
  initialLat,
  initialLng,
  initialRadiusMeters,
  onClose,
  onSave,
}: ShopLocationModalProps) {
  const [lat, setLat] = useState(initialLat ?? MOSCOW[0])
  const [lng, setLng] = useState(initialLng ?? MOSCOW[1])
  const [radius, setRadius] = useState<number | null>(initialRadiusMeters)

  const [unit, setUnit] = useState<'m' | 'km'>(() =>
    initialRadiusMeters !== null && initialRadiusMeters >= 1000 ? 'km' : 'm',
  )
  const [customInput, setCustomInput] = useState(() => {
    if (initialRadiusMeters === null) return ''
    return initialRadiusMeters >= 1000
      ? String(initialRadiusMeters / 1000)
      : String(initialRadiusMeters)
  })

  const applyRadius = (r: number | null, input: string) => {
    setRadius(r)
    setCustomInput(input)
  }

  const handleChipClick = (r: number | null) => {
    if (r === null) {
      applyRadius(null, '')
    } else {
      applyRadius(r, unit === 'km' ? String(r / 1000) : String(r))
    }
  }

  const handleCustomInput = (val: string) => {
    setCustomInput(val)
    const num = parseFloat(val)
    if (!val || isNaN(num) || num <= 0) {
      setRadius(null)
    } else {
      setRadius(Math.round(unit === 'km' ? num * 1000 : num))
    }
  }

  const handleUnitToggle = (next: 'm' | 'km') => {
    if (next === unit) return
    setUnit(next)
    if (radius !== null) {
      setCustomInput(next === 'km' ? String(radius / 1000) : String(radius))
    }
  }

  const [label, setLabel] = useState('')
  const [search, setSearch] = useState('')
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [recenter, setRecenter] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)

  const { suggestions, showSuggestions, dispatchSug } = useAddressSuggestions(search, label)

  const applyPoint = useApplyPoint({ setLat, setLng, setRecenter, setLabel, setSearch, setLoadingGeo })

  useEffect(() => {
    if (initialLat === null || initialLng === null) return
    reverseGeocode(initialLat, initialLng).then((l) => {
      setLabel(l)
      setSearch(l)
    })
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Element)) {
        dispatchSug({ type: 'hide' })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dispatchSug])

  const { handleSuggestionSelect, handleGeolocate } = useMapHandlers({ applyPoint, dispatchSug })

  const handleSave = useCallback(() => {
    onSave(lat, lng, radius, label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
  }, [lat, lng, radius, label, onSave])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-200 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl"
        style={{ background: 'color-mix(in srgb, var(--nav-bg) 75%, transparent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-nav-text">Местоположение магазина</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-nav-text/60" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 relative z-10" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nav-text/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() =>
                suggestions.length > 0 && dispatchSug({ type: 'set', items: suggestions })
              }
              placeholder="Адрес магазина..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-nav-text placeholder:text-nav-text/40 focus:outline-none focus:border-white/20 transition-colors"
            />
            {showSuggestions && (
              <div
                className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden border border-white/10 shadow-xl backdrop-blur-xl"
                style={{ background: 'color-mix(in srgb, var(--nav-bg) 85%, transparent)' }}
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionSelect(s)}
                    className="w-full text-left px-3 py-2.5 text-sm text-nav-text/80 hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-nav-text/40 shrink-0" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div
          className="mx-5 rounded-xl overflow-hidden border border-white/10 isolate"
          style={{ height: 300 }}
        >
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler onMapClick={(a, b) => void applyPoint(a, b)} />
            {recenter && <MapRecenter lat={lat} lng={lng} />}
            <Marker position={[lat, lng]} icon={markerIcon} />
            {radius !== null && (
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color: '#52796f',
                  fillColor: '#52796f',
                  fillOpacity: 0.12,
                  weight: 2,
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Radius + Actions */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-nav-text/80">Радиус обслуживания</span>
              <span className="text-sm font-medium text-accent">
                {radius !== null ? formatMeters(radius) : 'Не задан'}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => handleChipClick(null)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer',
                  radius === null
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-white/10 text-nav-text/60 hover:border-white/20 hover:text-nav-text',
                )}
              >
                Не задан
              </button>
              {SERVICE_RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleChipClick(r)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer',
                    radius === r
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-white/10 text-nav-text/60 hover:border-white/20 hover:text-nav-text',
                  )}
                >
                  {formatMeters(r)}
                </button>
              ))}
            </div>

            {/* Custom radius input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min="0"
                step={unit === 'km' ? '0.1' : '100'}
                value={customInput}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder={unit === 'km' ? 'напр. 1.5' : 'напр. 1500'}
                className="flex-1 h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-nav-text placeholder:text-nav-text/30 focus:outline-none focus:border-white/20 transition-colors input-no-spin"
              />
              <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
                {(['m', 'km'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => handleUnitToggle(u)}
                    className={cn(
                      'px-3 h-8 text-xs transition-colors cursor-pointer',
                      unit === u
                        ? 'bg-primary text-primary-foreground'
                        : 'text-nav-text/60 hover:text-nav-text hover:bg-white/5',
                    )}
                  >
                    {u === 'm' ? 'м' : 'км'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGeolocate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-sm text-nav-text/60 hover:text-nav-text hover:border-white/20 transition-colors cursor-pointer"
            >
              <Locate className="w-4 h-4" />
              Моё место
            </button>
            <button
              onClick={handleSave}
              disabled={loadingGeo}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {loadingGeo ? 'Определяю...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
