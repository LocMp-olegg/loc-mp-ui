import { useEffect } from 'react'
import { useMapEvents, useMap, TileLayer } from 'react-leaflet'
import { useTheme } from '@/contexts/theme-context'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function DarkModeTiles() {
  const { theme } = useTheme()
  const map = useMap()

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const pane = map.getPane('tilePane')
    if (pane)
      pane.style.filter = isDark
        ? 'invert(100%) hue-rotate(180deg) brightness(0.95) contrast(0.9)'
        : ''
  }, [theme, map])

  return null
}

export function ThemedTileLayer() {
  return (
    <>
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <DarkModeTiles />
    </>
  )
}

export function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

export function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true })
  }, [lat, lng, map])
  return null
}
