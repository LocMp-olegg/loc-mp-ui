import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import { MOSCOW } from '@/lib/map-constants'
import { MapClickHandler, MapRecenter } from '@/lib/map-utils'
import { ShopMarkers, MIN_ZOOM } from '@/components/shop/shop-markers'
import { X, Search, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useUserLocation, type UserLocation } from '@/contexts/location-context'
import { useAddressSuggestions } from '@/hooks/use-address-suggestions'
import { useApplyPoint } from '@/hooks/use-apply-point'
import { useMapHandlers } from '@/hooks/use-map-handlers'
import { RadiusInput } from '@/components/ui/radius-input'
import { cn } from '@/lib/utils'

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#52796f;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const RADIUS_OPTIONS = [0.2, 0.5, 1, 2, 3, 5, 10, 20]

function formatRadius(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} м` : `${km} км`
}

interface Props {
  onClose: () => void
}

export function LocationPicker({ onClose }: Props) {
  const { location, setLocation, clearLocation } = useUserLocation()

  const [lat, setLat] = useState(location?.lat ?? MOSCOW[0])
  const [lng, setLng] = useState(location?.lng ?? MOSCOW[1])
  const [label, setLabel] = useState(location?.label ?? '')
  const [radius, setRadius] = useState(location?.radius ?? 1)
  const [search, setSearch] = useState(location?.label ?? '')
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [recenter, setRecenter] = useState(false)

  const [unit, setUnit] = useState<'m' | 'km'>('km')
  const [customInput, setCustomInput] = useState(() => String(location?.radius ?? 1))

  const handleChipClick = (r: number) => {
    setRadius(r)
    setCustomInput(unit === 'km' ? String(r) : String(Math.round(r * 1000)))
  }

  const handleCustomInput = (val: string) => {
    setCustomInput(val)
    const num = parseFloat(val)
    if (!val || isNaN(num) || num <= 0) return
    setRadius(unit === 'km' ? num : num / 1000)
  }

  const handleUnitToggle = (next: 'm' | 'km') => {
    if (next === unit) return
    setUnit(next)
    setCustomInput(next === 'km' ? String(radius) : String(Math.round(radius * 1000)))
  }

  const searchRef = useRef<HTMLDivElement>(null)

  const { suggestions, showSuggestions, dispatchSug } = useAddressSuggestions(search, label)

  const applyPoint = useApplyPoint({
    setLat,
    setLng,
    setRecenter,
    setLabel,
    setSearch,
    setLoadingGeo,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        searchRef.current &&
        !searchRef.current.contains(target) &&
        !target.closest('[data-suggestions-portal]')
      ) {
        dispatchSug({ type: 'hide' })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dispatchSug])

  const { handleSuggestionSelect } = useMapHandlers({ applyPoint, dispatchSug })

  const handleSave = useCallback(() => {
    const loc: UserLocation = {
      lat,
      lng,
      label: label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      radius,
    }
    setLocation(loc)
    onClose()
  }, [lat, lng, label, radius, setLocation, onClose])

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
            <h2 className="font-semibold text-nav-text">Выберите район</h2>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() =>
                suggestions.length > 0 && dispatchSug({ type: 'set', items: suggestions })
              }
              placeholder="Адрес или район..."
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
            minZoom={MIN_ZOOM}
            maxZoom={18}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler onMapClick={(a, b) => void applyPoint(a, b)} />
            {recenter && <MapRecenter lat={lat} lng={lng} />}
            <ShopMarkers />
            <Marker position={[lat, lng]} icon={markerIcon} />
            <Circle
              center={[lat, lng]}
              radius={radius * 1000}
              pathOptions={{
                color: '#52796f',
                fillColor: '#52796f',
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          </MapContainer>
        </div>

        {/* Radius + Actions */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-nav-text/80">Радиус поиска</span>
              <span className="text-sm font-medium text-accent">{formatRadius(radius)}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {RADIUS_OPTIONS.map((r) => (
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
                  {formatRadius(r)}
                </button>
              ))}
            </div>

            <RadiusInput
              unit={unit}
              value={customInput}
              onChange={handleCustomInput}
              onUnitToggle={handleUnitToggle}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                clearLocation()
                onClose()
              }}
              className="px-3 py-2 rounded-xl border border-white/10 text-sm text-nav-text/60 hover:text-nav-text hover:border-white/20 transition-colors cursor-pointer"
            >
              Весь каталог
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
