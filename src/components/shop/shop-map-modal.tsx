import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { MapContainer, Marker, Circle } from 'react-leaflet'
import { ThemedTileLayer } from '@/lib/map-utils'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, MapPin } from 'lucide-react'

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#52796f;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function formatMeters(m: number): string {
  return m >= 1000 ? `${m / 1000} км` : `${m} м`
}

interface ShopMapModalProps {
  shopName: string
  lat: number
  lng: number
  radiusMeters: number | null
  addressLine: string | null
  onClose: () => void
}

export function ShopMapModal({
  shopName,
  lat,
  lng,
  radiusMeters,
  addressLine,
  onClose,
}: ShopMapModalProps) {
  const mapsUrl = `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`

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
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-nav-text truncate">{shopName}</p>
              {addressLine && (
                <p className="text-xs text-nav-text/50 truncate mt-0.5">{addressLine}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors shrink-0 ml-3"
          >
            <X className="w-4 h-4 text-nav-text/60" />
          </button>
        </div>

        {/* Map */}
        <div style={{ height: 400 }}>
          <MapContainer
            center={[lat, lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl
          >
            <ThemedTileLayer />
            <Marker position={[lat, lng]} icon={markerIcon} />
            {radiusMeters !== null && (
              <Circle
                center={[lat, lng]}
                radius={radiusMeters}
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

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
          <div className="flex items-center gap-2 text-sm text-nav-text/60">
            {radiusMeters !== null && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-primary/70 bg-primary/20 shrink-0" />
                Зона обслуживания: {formatMeters(radiusMeters)}
              </span>
            )}
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" />
            Открыть в Яндекс Картах
          </a>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
