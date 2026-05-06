import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, Search, MapPin } from 'lucide-react'
import { MOSCOW } from '@/lib/map-constants'
import { MapClickHandler, MapRecenter } from '@/lib/map-utils'
import { useAddressSuggestions } from '@/hooks/use-address-suggestions'
import { reverseGeocodeStructured } from '@/lib/geo'
import { cn } from '@/lib/utils'
import type {
  UserAddressDto,
  CreateUserAddressRequest,
  UpdateUserAddressRequest,
} from '@/api/identity'
import type { GeoSuggestion } from '@/lib/geo'

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#52796f;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface FormErrors {
  title?: string
  city?: string
  street?: string
  houseNumber?: string
}

function validate(fields: {
  title: string
  city: string
  street: string
  houseNumber: string
}): FormErrors {
  const e: FormErrors = {}
  if (!fields.title.trim()) e.title = 'Обязательное поле'
  else if (fields.title.length > 100) e.title = 'Максимум 100 символов'
  if (!fields.city.trim()) e.city = 'Обязательное поле'
  else if (fields.city.length > 100) e.city = 'Максимум 100 символов'
  if (!fields.street.trim()) e.street = 'Обязательное поле'
  else if (fields.street.length > 250) e.street = 'Максимум 250 символов'
  if (!fields.houseNumber.trim()) e.houseNumber = 'Обязательное поле'
  else if (fields.houseNumber.length > 20) e.houseNumber = 'Максимум 20 символов'
  return e
}

interface Props {
  initial?: UserAddressDto
  onClose: () => void
  onSave: (data: CreateUserAddressRequest | UpdateUserAddressRequest) => Promise<void>
}

export function AddressFormModal({ initial, onClose, onSave }: Props) {
  const isEdit = !!initial

  const [title, setTitle] = useState(initial?.title ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [street, setStreet] = useState(initial?.street ?? '')
  const [houseNumber, setHouseNumber] = useState(initial?.houseNumber ?? '')
  const [apartment, setApartment] = useState(initial?.apartment ?? '')
  const [entrance, setEntrance] = useState(initial?.entrance ?? '')
  const [floor, setFloor] = useState(initial?.floor ?? '')
  const [lat, setLat] = useState<number | null>(initial?.latitude ?? null)
  const [lng, setLng] = useState<number | null>(initial?.longitude ?? null)
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false)
  const [recenter, setRecenter] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const errors: FormErrors = submitted ? validate({ title, city, street, houseNumber }) : {}
  const [confirmClose, setConfirmClose] = useState(false)

  const isDirty = useMemo(() => {
    if (!initial) {
      return !!(title || city || street || houseNumber || apartment || entrance || floor || lat)
    }
    return (
      title !== (initial.title ?? '') ||
      city !== (initial.city ?? '') ||
      street !== (initial.street ?? '') ||
      houseNumber !== (initial.houseNumber ?? '') ||
      apartment !== (initial.apartment ?? '') ||
      entrance !== (initial.entrance ?? '') ||
      floor !== (initial.floor ?? '') ||
      lat !== (initial.latitude ?? null) ||
      lng !== (initial.longitude ?? null)
    )
  }, [title, city, street, houseNumber, apartment, entrance, floor, lat, lng, initial])

  const handleClose = useCallback(() => {
    if (isDirty) setConfirmClose(true)
    else onClose()
  }, [isDirty, onClose])

  const [search, setSearch] = useState(() => {
    if (!initial) return ''
    const parts = [initial.street, initial.houseNumber].filter(Boolean).join(', ')
    return [parts, initial.city].filter(Boolean).join(', ')
  })
  const [searchLabel, setSearchLabel] = useState(search)

  const searchRef = useRef<HTMLDivElement>(null)
  const { suggestions, showSuggestions, dispatchSug } = useAddressSuggestions(search, searchLabel)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Element)) {
        dispatchSug({ type: 'hide' })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dispatchSug])

  const applySuggestion = useCallback((s: GeoSuggestion) => {
    setLat(s.lat)
    setLng(s.lng)
    setRecenter(true)
    setSearch(s.label)
    setSearchLabel(s.label)
    if (s.city) setCity(s.city)
    if (s.street) setStreet(s.street)
    if (s.houseNumber) setHouseNumber(s.houseNumber)
    setApartment(s.apartment ?? '')
    setEntrance('')
    setFloor('')
  }, [])

  const handleSuggestionSelect = (s: GeoSuggestion) => {
    dispatchSug({ type: 'clear' })
    applySuggestion(s)
  }

  const applyMapClick = useCallback(
    async (newLat: number, newLng: number) => {
      setLat(newLat)
      setLng(newLng)
      setRecenter(true)
      setLoadingGeo(true)
      const s = await reverseGeocodeStructured(newLat, newLng)
      setLoadingGeo(false)
      if (s) applySuggestion(s)
    },
    [applySuggestion],
  )

  const handleSave = async () => {
    setSubmitted(true)
    const errs = validate({ title, city, street, houseNumber })
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        city: city.trim(),
        street: street.trim(),
        houseNumber: houseNumber.trim(),
        apartment: apartment.trim() || null,
        entrance: entrance.trim() || null,
        floor: floor.trim() || null,
        latitude: lat,
        longitude: lng,
        ...(!isEdit && { isDefault }),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const mapCenter: [number, number] = lat !== null && lng !== null ? [lat, lng] : MOSCOW

  const field =
    'w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors'
  const fieldOk = 'border-border focus:border-primary/50'
  const fieldErr = 'border-destructive/60 focus:border-destructive'

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">
              {isEdit ? 'Редактировать адрес' : 'Новый адрес'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* DaData search */}
          <div ref={searchRef} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() =>
                suggestions.length > 0 && dispatchSug({ type: 'set', items: suggestions })
              }
              placeholder="Найти адрес..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden border border-border shadow-xl bg-card"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionSelect(s)}
                      className="w-full text-left px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Map */}
          <div
            className="relative rounded-xl overflow-hidden border border-border isolate"
            style={{ height: 200 }}
          >
            <MapContainer
              center={mapCenter}
              zoom={lat !== null ? 16 : 10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapClickHandler onMapClick={(a, b) => void applyMapClick(a, b)} />
              {recenter && lat !== null && lng !== null && <MapRecenter lat={lat} lng={lng} />}
              {lat !== null && lng !== null && <Marker position={[lat, lng]} icon={markerIcon} />}
            </MapContainer>
            {loadingGeo && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm pointer-events-none">
                <span className="text-xs text-muted-foreground animate-pulse">
                  Определяю адрес...
                </span>
              </div>
            )}
            {lat === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 pointer-events-none">
                <span className="text-xs text-muted-foreground/70">
                  Найдите адрес или кликните на карту
                </span>
              </div>
            )}
          </div>

          {/* Название */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Название <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Дом, Работа, Дача..."
              className={cn(field, errors.title ? fieldErr : fieldOk)}
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          {/* Город + Дом */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Город <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder=""
                className={cn(field, errors.city ? fieldErr : fieldOk)}
              />
              {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Дом <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder=""
                className={cn(field, errors.houseNumber ? fieldErr : fieldOk)}
              />
              {errors.houseNumber && (
                <p className="text-xs text-destructive mt-1">{errors.houseNumber}</p>
              )}
            </div>
          </div>

          {/* Улица */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Улица <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder=""
              className={cn(field, errors.street ? fieldErr : fieldOk)}
            />
            {errors.street && <p className="text-xs text-destructive mt-1">{errors.street}</p>}
          </div>

          {/* Квартира + Подъезд + Этаж */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Квартира
              </label>
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                placeholder=""
                className={cn(field, fieldOk)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Подъезд
              </label>
              <input
                type="text"
                value={entrance}
                onChange={(e) => setEntrance(e.target.value)}
                placeholder=""
                className={cn(field, fieldOk)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Этаж</label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder=""
                className={cn(field, fieldOk)}
              />
            </div>
          </div>

          {/* isDefault (only on create) */}
          {!isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setIsDefault((v) => !v)}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative shrink-0',
                  isDefault ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                    isDefault ? 'left-5' : 'left-1',
                  )}
                />
              </div>
              <span className="text-sm text-foreground">Основной адрес</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={() => void handleSave()}
            disabled={saving || loadingGeo}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Добавить адрес'}
          </button>
        </div>

        {/* Unsaved changes confirmation */}
        <AnimatePresence>
          {confirmClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/90 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <p className="text-sm font-semibold text-foreground">Несохранённые изменения</p>
                <p className="text-xs text-muted-foreground">
                  Вы уверены, что хотите закрыть? Изменения будут потеряны.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmClose(false)}
                    className="px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Остаться
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Покинуть
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
