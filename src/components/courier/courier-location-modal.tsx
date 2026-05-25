import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { MapContainer, Marker, Circle } from 'react-leaflet'
import { MOSCOW } from '@/lib/map-constants'
import { MapClickHandler, MapRecenter, ThemedTileLayer } from '@/lib/map-utils'
import { ShopMarkers } from '@/components/shop/shop-markers'
import type { GeoSuggestion } from '@/lib/geo'
import type { UserAddressDto } from '@/api/identity'
import { X, Search, Check } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAddressSuggestions } from '@/hooks/use-address-suggestions'
import { cn } from '@/lib/utils'

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#2a9d8f;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function formatAddressLabel(a: UserAddressDto): string {
  return a.title || [a.street, a.houseNumber].filter(Boolean).join(', ') || a.city || 'Адрес'
}

interface CourierLocationModalProps {
  initialLat: number | null
  initialLng: number | null
  addresses?: UserAddressDto[]
  radiusMeters?: number
  onClose: () => void
  onSave: (lat: number, lng: number, label: string) => void
}

export function CourierLocationModal({
  initialLat,
  initialLng,
  addresses = [],
  radiusMeters,
  onClose,
  onSave,
}: CourierLocationModalProps) {
  const [lat, setLat] = useState(initialLat ?? MOSCOW[0])
  const [lng, setLng] = useState(initialLng ?? MOSCOW[1])
  const [recenter, setRecenter] = useState(false)
  const [search, setSearch] = useState('')
  const [label, setLabel] = useState('')

  const searchRef = useRef<HTMLDivElement>(null)

  const { suggestions, showSuggestions, dispatchSug } = useAddressSuggestions(search, label)

  const geoAddresses = addresses.filter((a) => a.latitude != null && a.longitude != null)

  const handleMapClick = useCallback((newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
    setLabel(`${newLat.toFixed(5)}, ${newLng.toFixed(5)}`)
    setSearch(`${newLat.toFixed(5)}, ${newLng.toFixed(5)}`)
    setRecenter(true)
  }, [])

  const handleSuggestionSelect = (s: GeoSuggestion) => {
    setLat(s.lat)
    setLng(s.lng)
    setLabel(s.label)
    setSearch(s.label)
    setRecenter(true)
    dispatchSug({ type: 'clear' })
  }

  const handleAddressSelect = (a: UserAddressDto) => {
    const newLat = a.latitude!
    const newLng = a.longitude!
    setLat(newLat)
    setLng(newLng)
    setLabel(formatAddressLabel(a))
    setSearch(formatAddressLabel(a))
    setRecenter(true)
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="flex flex-col h-full max-h-[92dvh] w-full max-w-xl mx-auto mt-auto rounded-t-3xl overflow-hidden"
        style={{ background: 'var(--nav-bg)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/8 shrink-0">
          <div className="flex-1">
            <p className="text-sm font-semibold text-nav-text">Базовая точка</p>
            <p className="text-xs text-nav-text/50 mt-0.5">Кликните на карте или найдите адрес</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-nav-text/60 hover:text-nav-text hover:bg-white/8 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saved addresses */}
        {geoAddresses.length > 0 && (
          <div className="px-4 py-3 border-b border-white/8 shrink-0">
            <p className="text-[11px] text-nav-text/40 mb-2 uppercase tracking-wide">Мои адреса</p>
            <div className="flex flex-wrap gap-2">
              {geoAddresses.map((a) => {
                const addrLabel = formatAddressLabel(a)
                const isSelected = lat === a.latitude && lng === a.longitude
                return (
                  <button
                    key={a.id}
                    type="button"
                    onMouseDown={() => handleAddressSelect(a)}
                    className={cn(
                      'flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs border transition-colors cursor-pointer shrink-0',
                      isSelected
                        ? 'bg-primary/20 border-primary/40 text-nav-text'
                        : 'border-white/10 bg-white/5 text-nav-text/70 hover:bg-white/10 hover:text-nav-text',
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    <span className="truncate max-w-[140px]">{addrLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/8 shrink-0" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nav-text/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
              }}
              onBlur={() => setTimeout(() => dispatchSug({ type: 'hide' }), 150)}
              placeholder="Поиск адреса..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-white/10 bg-white/5 text-sm text-nav-text placeholder:text-nav-text/30 focus:outline-none focus:border-white/20 transition-colors"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-nav-bg shadow-lg z-10 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => handleSuggestionSelect(s)}
                    className="w-full px-3 py-2 text-left text-xs text-nav-text/80 hover:bg-white/8 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-0">
          <MapContainer
            center={[lat, lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ThemedTileLayer />
            <MapClickHandler onMapClick={handleMapClick} />
            {recenter && <MapRecenter lat={lat} lng={lng} />}
            <ShopMarkers />
            {radiusMeters && (
              <Circle
                center={[lat, lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#2a9d8f',
                  fillColor: '#2a9d8f',
                  fillOpacity: 0.08,
                  weight: 1.5,
                }}
              />
            )}
            <Marker position={[lat, lng]} icon={markerIcon} />
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/8 shrink-0 flex items-center gap-3">
          <div className="flex-1 text-xs text-nav-text/50 truncate">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-white/12 text-nav-text/70 text-sm hover:bg-white/5 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onSave(lat, lng, label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)}
            className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
