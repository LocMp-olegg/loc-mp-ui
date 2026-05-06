import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, ChevronDown, Star, Map, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAddresses } from '@/contexts/addresses-context'
import { useUserLocation } from '@/contexts/location-context'
import { cn } from '@/lib/utils'
import type { UserAddressDto } from '@/api/identity'

function formatShort(addr: UserAddressDto): string {
  const street = [addr.street, addr.houseNumber].filter(Boolean).join(', ')
  return street || addr.city || 'Адрес'
}

function formatRadius(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} м`
  return `${Number.isInteger(km) ? km : km} км`
}

const RADIUS_PRESETS = [0.5, 1, 2, 3, 5]

interface Props {
  onOpenPicker: () => void
  scrolled?: boolean
  className?: string
}

export function AddressDropdown({ onOpenPicker, scrolled, className }: Props) {
  const { addresses, loading } = useAddresses()
  const { location, setLocation, clearLocation } = useUserLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeAddr = addresses.find(
    (a) => a.latitude === location?.lat && a.longitude === location?.lng,
  )

  const handleSelect = (addr: UserAddressDto) => {
    if (addr.latitude == null || addr.longitude == null) return
    setLocation({
      lat: addr.latitude,
      lng: addr.longitude,
      label: addr.title || formatShort(addr),
      radius: location?.radius ?? 1,
    })
    setOpen(false)
  }

  const handleClear = () => {
    clearLocation()
    setOpen(false)
  }

  const handleOpenPicker = () => {
    setOpen(false)
    onOpenPicker()
  }

  const buttonLabel = activeAddr
    ? (activeAddr.title || formatShort(activeAddr))
    : location
      ? location.label
      : 'Выбрать район'

  const hasLocation = !!location

  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        animate={{
          paddingLeft: scrolled ? 8 : 12,
          paddingRight: scrolled ? 8 : 12,
          paddingTop: scrolled ? 8 : 6,
          paddingBottom: scrolled ? 8 : 6,
          borderRadius: scrolled ? 12 : 9999,
          backgroundColor: scrolled ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.1)',
          boxShadow: scrolled ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.15)',
        }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
      >
        <MapPin className={cn('w-5 h-5 shrink-0', hasLocation ? 'text-accent' : 'text-nav-text/70')} />
        <AnimatePresence initial={false}>
          {!scrolled && (
            <motion.span
              key="loc-label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-nav-text/80 overflow-hidden whitespace-nowrap hidden lg:flex items-center gap-1"
            >
              <span className="truncate max-w-28">{buttonLabel}</span>
              {hasLocation && location && (
                <span className="text-xs text-nav-text/50 shrink-0">· {formatRadius(location.radius)}</span>
              )}
              <ChevronDown
                className={cn(
                  'w-3 h-3 text-nav-text/50 shrink-0 transition-transform duration-150',
                  open && 'rotate-180',
                )}
              />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 mt-2 z-50 min-w-56 max-w-72 rounded-xl border border-white/10 bg-nav-bg/95 backdrop-blur-md shadow-xl overflow-hidden"
          >
            {/* Saved addresses */}
            {!loading && addresses.length > 0 && (
              <>
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[10px] font-semibold text-nav-text/40 uppercase tracking-wider">
                    Мои адреса
                  </p>
                </div>
                {addresses.map((addr) => {
                  const isActive =
                    addr.latitude === location?.lat && addr.longitude === location?.lng
                  return (
                    <button
                      key={addr.id}
                      onClick={() => handleSelect(addr)}
                      disabled={addr.latitude == null}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/8 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
                    >
                      <div className="w-4 shrink-0 mt-0.5">
                        {isActive ? (
                          <Check className="w-3.5 h-3.5 text-accent" />
                        ) : addr.isDefault ? (
                          <Star className="w-3 h-3 text-nav-text/30 fill-current" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-sm truncate', isActive ? 'text-accent font-medium' : 'text-nav-text/80')}>
                          {addr.title || 'Адрес'}
                        </p>
                        <p className="text-xs text-nav-text/45 truncate mt-0.5">
                          {formatShort(addr)}{addr.city ? ` · ${addr.city}` : ''}
                        </p>
                      </div>
                    </button>
                  )
                })}
                <div className="border-t border-white/8 my-1" />
              </>
            )}

            {loading && (
              <div className="px-3 py-3 space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            )}

            {/* Radius */}
            {hasLocation && location && (
              <div className="px-3 py-2.5 border-t border-white/8">
                <p className="text-[10px] font-semibold text-nav-text/40 uppercase tracking-wider mb-2">
                  Радиус поиска
                </p>
                <div className="flex gap-1.5">
                  {RADIUS_PRESETS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setLocation({ ...location, radius: r })}
                      className={cn(
                        'flex-1 py-1 rounded-lg text-xs transition-colors cursor-pointer',
                        location.radius === r
                          ? 'bg-accent/20 text-accent font-semibold'
                          : 'text-nav-text/55 hover:bg-white/8 hover:text-nav-text',
                      )}
                    >
                      {formatRadius(r)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {hasLocation && (
              <button
                onClick={handleClear}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-nav-text/70 hover:bg-white/8 hover:text-nav-text transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 shrink-0 text-nav-text/40" />
                Весь каталог
              </button>
            )}
            <button
              onClick={handleOpenPicker}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-nav-text/70 hover:bg-white/8 hover:text-nav-text transition-colors cursor-pointer"
            >
              <Map className="w-4 h-4 shrink-0 text-nav-text/40" />
              Выбрать на карте
            </button>
            <div className="border-t border-white/8" />
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-nav-text/70 hover:bg-white/8 hover:text-nav-text transition-colors"
            >
              <MapPin className="w-4 h-4 shrink-0 text-nav-text/40" />
              Управлять адресами
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
