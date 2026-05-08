import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import { MOSCOW } from '@/lib/map-constants'
import { MapClickHandler, MapRecenter } from '@/lib/map-utils'
import { X, Search, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode, reverseGeocodeStructured } from '@/lib/geo'
import type { GeoSuggestion } from '@/lib/geo'
import { useAddressSuggestions } from '@/hooks/use-address-suggestions'
import { useAddressFormFields } from '@/hooks/use-address-form-fields'
import { useAutoGeocode } from '@/hooks/use-auto-geocode'
import { FieldSugDropdown } from '@/components/ui/field-sug-dropdown'
import { RadiusInput } from '@/components/ui/radius-input'
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

export interface ShopAddressFields {
  city: string
  street: string
  houseNumber: string
  apartment: string
  entrance: string
  floor: string
}

interface ShopLocationModalProps {
  initialLat: number | null
  initialLng: number | null
  initialRadiusMeters: number | null
  initialAddress?: Partial<ShopAddressFields>
  onClose: () => void
  onSave: (
    lat: number,
    lng: number,
    radiusMeters: number | null,
    label: string,
    address: ShopAddressFields,
  ) => void
}

const fieldCls =
  'w-full px-3 py-2 rounded-xl border text-sm text-nav-text placeholder:text-nav-text/30 bg-white/5 focus:outline-none transition-colors'
const fieldOk = 'border-white/10 focus:border-white/25'
const fieldErr = 'border-red-400/60 focus:border-red-400'

interface FormErrors {
  city?: string
  street?: string
  houseNumber?: string
}

function validate(city: string, street: string, houseNumber: string): FormErrors {
  const e: FormErrors = {}
  if (!city.trim()) e.city = 'Обязательное поле'
  if (!street.trim()) e.street = 'Обязательное поле'
  if (!houseNumber.trim()) e.houseNumber = 'Обязательное поле'
  return e
}

export function ShopLocationModal({
  initialLat,
  initialLng,
  initialRadiusMeters,
  initialAddress,
  onClose,
  onSave,
}: ShopLocationModalProps) {
  // ── Coordinates ───────────────────────────────────────────────
  const [lat, setLat] = useState(initialLat ?? MOSCOW[0])
  const [lng, setLng] = useState(initialLng ?? MOSCOW[1])
  const [recenter, setRecenter] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)

  // ── Radius ────────────────────────────────────────────────────
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

  const handleChipClick = (r: number | null) => {
    setRadius(r)
    setCustomInput(r === null ? '' : unit === 'km' ? String(r / 1000) : String(r))
  }

  const handleCustomInput = (val: string) => {
    setCustomInput(val)
    const num = parseFloat(val)
    setRadius(!val || isNaN(num) || num <= 0 ? null : Math.round(unit === 'km' ? num * 1000 : num))
  }

  const handleUnitToggle = (next: 'm' | 'km') => {
    if (next === unit) return
    setUnit(next)
    if (radius !== null) setCustomInput(next === 'km' ? String(radius / 1000) : String(radius))
  }

  // ── Address fields ────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false)

  const {
    city,
    setCity,
    street,
    setStreet,
    houseNumber,
    setHouseNumber,
    apartment,
    setApartment,
    entrance,
    setEntrance,
    floor,
    setFloor,
    setActiveField,
    citySug,
    streetSug,
    houseSug,
    applyGeoSuggestion: applyAddressFields,
    handleCitySelect,
    handleStreetSelect,
    handleHouseSelect,
  } = useAddressFormFields({
    initial: initialAddress,
    onCoordinatesReset: () => {
      setLat(initialLat ?? MOSCOW[0])
      setLng(initialLng ?? MOSCOW[1])
    },
    onHouseCoordinates: (hLat, hLng, hLabel) => {
      setLat(hLat)
      setLng(hLng)
      setRecenter(true)
      setSearch(hLabel)
      setLabel(hLabel)
    },
  })

  // ── Map search bar ────────────────────────────────────────────
  const [label, setLabel] = useState('')
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const { suggestions, showSuggestions, dispatchSug } = useAddressSuggestions(search, label)

  // ── Auto-geocode when address fields are filled manually ──────
  const onGeoFound = useCallback((gLat: number, gLng: number) => {
    setLat(gLat)
    setLng(gLng)
    setRecenter(true)
  }, [])
  const { geocodeLookup, dispatchGeocode } = useAutoGeocode({
    city,
    street,
    houseNumber,
    hasCoordinates: lat !== (initialLat ?? MOSCOW[0]) || lng !== (initialLng ?? MOSCOW[1]),
    onFound: onGeoFound,
  })

  // Apply a full DaData suggestion (search bar OR map click)
  const applyGeoSuggestion = useCallback(
    (s: GeoSuggestion) => {
      setLat(s.lat)
      setLng(s.lng)
      setRecenter(true)
      setLabel(s.label)
      setSearch(s.label)
      applyAddressFields(s)
      dispatchGeocode('found')
    },
    [applyAddressFields, dispatchGeocode],
  )

  // ── Init: reverse-geocode existing coordinates ────────────────
  const initLatRef = useRef(initialLat)
  const initLngRef = useRef(initialLng)
  useEffect(() => {
    if (initLatRef.current === null || initLngRef.current === null) return
    reverseGeocode(initLatRef.current, initLngRef.current).then((l) => {
      setLabel(l)
      setSearch(l)
    })
  }, [])

  // ── Hide suggestions on outside click ────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Element))
        dispatchSug({ type: 'hide' })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dispatchSug])

  // ── Search bar suggestion select ──────────────────────────────
  const handleSuggestionSelect = (s: GeoSuggestion) => {
    dispatchSug({ type: 'clear' })
    applyGeoSuggestion(s)
  }

  // ── Map click ─────────────────────────────────────────────────
  const handleMapClick = async (clickLat: number, clickLng: number) => {
    setLat(clickLat)
    setLng(clickLng)
    setRecenter(true)
    setLoadingGeo(true)
    const s = await reverseGeocodeStructured(clickLat, clickLng)
    setLoadingGeo(false)
    if (s) {
      applyGeoSuggestion(s)
    } else {
      const name = await reverseGeocode(clickLat, clickLng)
      setLabel(name)
      setSearch(name)
    }
  }

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setSubmitted(true)
    const errs = validate(city, street, houseNumber)
    if (Object.keys(errs).length > 0) return
    onSave(lat, lng, radius, label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, {
      city: city.trim(),
      street: street.trim(),
      houseNumber: houseNumber.trim(),
      apartment: apartment.trim(),
      entrance: entrance.trim(),
      floor: floor.trim(),
    })
  }, [lat, lng, radius, label, city, street, houseNumber, apartment, entrance, floor, onSave])

  const errors: FormErrors = submitted ? validate(city, street, houseNumber) : {}

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
        className="w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl max-h-[90vh] flex flex-col"
        style={{ background: 'color-mix(in srgb, var(--nav-bg) 75%, transparent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
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

        <div className="overflow-y-auto flex-1">
          {/* Search bar */}
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
                placeholder="Найти адрес..."
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
            className="relative mx-5 rounded-xl overflow-hidden border border-white/10 isolate"
            style={{ height: 240 }}
          >
            <MapContainer
              center={[lat, lng]}
              zoom={initialLat !== null ? 15 : 10}
              style={{ height: '100%', width: '100%' }}
              zoomControl
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapClickHandler onMapClick={(a, b) => void handleMapClick(a, b)} />
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
            {(loadingGeo || geocodeLookup === 'loading') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
                <span className="text-xs text-nav-text/70 animate-pulse">
                  {geocodeLookup === 'loading' ? 'Определяем координаты...' : 'Определяю адрес...'}
                </span>
              </div>
            )}
          </div>
          {geocodeLookup === 'notFound' && (
            <p className="text-xs text-red-400/80 px-5 mt-1.5">
              Координаты не найдены. Уточните адрес через поиск или кликните на карту.
            </p>
          )}

          {/* Address fields */}
          <div className="px-5 pt-4 space-y-3">
            <p className="text-xs font-medium text-nav-text/50 uppercase tracking-wide">Адрес</p>

            {/* Город */}
            <div>
              <label className="block text-xs text-nav-text/50 mb-1.5">
                Город <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setActiveField('city')}
                  onBlur={() => setActiveField(null)}
                  className={cn(fieldCls, errors.city ? fieldErr : fieldOk)}
                />
                <FieldSugDropdown
                  open={citySug.open}
                  items={citySug.suggestions}
                  onSelect={handleCitySelect}
                />
              </div>
              {errors.city && <p className="text-xs text-red-400/80 mt-1">{errors.city}</p>}
            </div>

            {/* Улица + Дом */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="block text-xs text-nav-text/50 mb-1.5">
                  Улица <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    onFocus={() => setActiveField('street')}
                    onBlur={() => setActiveField(null)}
                    className={cn(fieldCls, errors.street ? fieldErr : fieldOk)}
                  />
                  <FieldSugDropdown
                    open={streetSug.open}
                    items={streetSug.suggestions}
                    onSelect={handleStreetSelect}
                  />
                </div>
                {errors.street && <p className="text-xs text-red-400/80 mt-1">{errors.street}</p>}
              </div>
              <div className="w-24">
                <label className="block text-xs text-nav-text/50 mb-1.5">
                  Дом <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    onFocus={() => setActiveField('house')}
                    onBlur={() => setActiveField(null)}
                    className={cn(fieldCls, errors.houseNumber ? fieldErr : fieldOk)}
                  />
                  <FieldSugDropdown
                    open={houseSug.open}
                    items={houseSug.suggestions}
                    onSelect={handleHouseSelect}
                  />
                </div>
                {errors.houseNumber && (
                  <p className="text-xs text-red-400/80 mt-1">{errors.houseNumber}</p>
                )}
              </div>
            </div>

            {/* Помещение / Подъезд / Этаж */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-nav-text/50 mb-1.5">Помещение</label>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className={cn(fieldCls, fieldOk)}
                />
              </div>
              <div>
                <label className="block text-xs text-nav-text/50 mb-1.5">Подъезд</label>
                <input
                  type="text"
                  value={entrance}
                  onChange={(e) => setEntrance(e.target.value)}
                  className={cn(fieldCls, fieldOk)}
                />
              </div>
              <div>
                <label className="block text-xs text-nav-text/50 mb-1.5">Этаж</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className={cn(fieldCls, fieldOk)}
                />
              </div>
            </div>
          </div>

          {/* Radius */}
          <div className="px-5 pt-4 pb-2">
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
            <RadiusInput
              unit={unit}
              value={customInput}
              onChange={handleCustomInput}
              onUnitToggle={handleUnitToggle}
            />
          </div>

          {/* Save */}
          <div className="px-5 pb-5 pt-2">
            <button
              onClick={handleSave}
              disabled={loadingGeo || geocodeLookup === 'loading'}
              className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {loadingGeo || geocodeLookup === 'loading' ? 'Определяю...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
