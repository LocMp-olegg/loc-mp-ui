import { useState, useEffect, useRef, useCallback, useReducer, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import { X, Locate, Search, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { suggestAddress, reverseGeocode, type GeoSuggestion } from '@/lib/geo'
import { useUserLocation, type UserLocation } from '@/contexts/location-context'
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
const MOSCOW: [number, number] = [55.7558, 37.6173]

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function SuggestionsPortal({
  suggestions,
  anchorRef,
  onSelect,
}: {
  suggestions: GeoSuggestion[]
  anchorRef: RefObject<HTMLDivElement | null>
  onSelect: (s: GeoSuggestion) => void
}) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const update = () => setRect(el.getBoundingClientRect())
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [anchorRef])

  if (!rect) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }}
      data-suggestions-portal
      className="bg-card border border-border rounded-xl shadow-lg overflow-hidden"
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {s.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true })
  }, [lat, lng, map])
  return null
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
  const [{ suggestions, showSuggestions }, dispatchSug] = useReducer(
    (
      s: { suggestions: GeoSuggestion[]; showSuggestions: boolean },
      a: { type: 'set'; items: GeoSuggestion[] } | { type: 'clear' } | { type: 'hide' },
    ) => {
      if (a.type === 'set') return { suggestions: a.items, showSuggestions: a.items.length > 0 }
      if (a.type === 'hide') return { ...s, showSuggestions: false }
      return { suggestions: [], showSuggestions: false }
    },
    { suggestions: [], showSuggestions: false },
  )
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [recenter, setRecenter] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!search.trim() || search === label) {
      dispatchSug({ type: 'clear' })
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await suggestAddress(search)
      dispatchSug({ type: 'set', items: results })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, label])

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
  }, [])

  const applyPoint = useCallback(async (newLat: number, newLng: number, knownLabel?: string) => {
    setLat(newLat)
    setLng(newLng)
    setRecenter(true)
    if (knownLabel) {
      setLabel(knownLabel)
      setSearch(knownLabel)
    } else {
      setLoadingGeo(true)
      const name = await reverseGeocode(newLat, newLng)
      setLabel(name)
      setSearch(name)
      setLoadingGeo(false)
    }
  }, [])

  const handleSuggestionSelect = useCallback(
    (s: GeoSuggestion) => {
      dispatchSug({ type: 'clear' })
      applyPoint(s.lat, s.lng, s.label)
    },
    [applyPoint],
  )

  const handleGeolocate = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPoint(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { timeout: 5000 },
    )
  }, [applyPoint])

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
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Выберите район</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
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
              onFocus={() => suggestions.length > 0 && dispatchSug({ type: 'set', items: suggestions })}
              placeholder="Адрес или район..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            {showSuggestions && (
              <SuggestionsPortal
                suggestions={suggestions}
                anchorRef={searchRef}
                onSelect={handleSuggestionSelect}
              />
            )}
          </div>
        </div>

        {/* Map */}
        <div className="mx-5 rounded-xl overflow-hidden border border-border" style={{ height: 300 }}>
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapClickHandler onMapClick={(a, b) => applyPoint(a, b)} />
            {recenter && <MapRecenter lat={lat} lng={lng} />}
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
              <span className="text-sm text-foreground">Радиус поиска</span>
              <span className="text-sm font-medium text-primary">{formatRadius(radius)}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer',
                    radius === r
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  {formatRadius(r)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGeolocate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
            >
              <Locate className="w-4 h-4" />
              Моё место
            </button>
            <button
              onClick={() => { clearLocation(); onClose() }}
              className="px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
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
