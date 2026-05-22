import { useEffect, useMemo } from 'react'
import { Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useShopsMap, MIN_ZOOM } from '@/hooks/use-shops-map'
import type { ShopPin } from '@/hooks/use-shops-map'
import { ShopPinPopup } from './shop-pin-popup'

const shopIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;background:#f4a261;border:2px solid white;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

type BoundsCallback = (
  swLat: number,
  swLon: number,
  neLat: number,
  neLon: number,
  zoom: number,
) => void

function MapEventHandler({ onBounds }: { onBounds: BoundsCallback }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds()
      const zoom = map.getZoom()
      onBounds(b.getSouth(), b.getWest(), b.getNorth(), b.getEast(), zoom)
    },
    zoomend: () => {
      const b = map.getBounds()
      const zoom = map.getZoom()
      onBounds(b.getSouth(), b.getWest(), b.getNorth(), b.getEast(), zoom)
    },
  })

  useEffect(() => {
    const b = map.getBounds()
    const zoom = map.getZoom()
    onBounds(b.getSouth(), b.getWest(), b.getNorth(), b.getEast(), zoom)
  }, [map, onBounds])

  return null
}

function applySpiderfy(
  pins: ShopPin[],
): Array<ShopPin & { displayLat: number; displayLng: number }> {
  const byPos = new Map<string, ShopPin[]>()
  for (const pin of pins) {
    const key = `${pin.lat.toFixed(4)},${pin.lng.toFixed(4)}`
    const group = byPos.get(key) ?? []
    group.push(pin)
    byPos.set(key, group)
  }
  const R = 0.00015
  const result: Array<ShopPin & { displayLat: number; displayLng: number }> = []
  for (const group of byPos.values()) {
    group.forEach((pin, i) => {
      const angle = group.length > 1 ? (2 * Math.PI * i) / group.length : 0
      result.push({
        ...pin,
        displayLat: pin.lat + (group.length > 1 ? R * Math.sin(angle) : 0),
        displayLng: pin.lng + (group.length > 1 ? R * Math.cos(angle) : 0),
      })
    })
  }
  return result
}

export function ShopMarkers() {
  const { pins, fetchForBounds } = useShopsMap()
  const displayPins = useMemo(() => applySpiderfy(pins), [pins])

  return (
    <>
      <MapEventHandler onBounds={fetchForBounds} />
      {displayPins.map((pin) => (
        <Marker key={pin.shopId} position={[pin.displayLat, pin.displayLng]} icon={shopIcon}>
          <Popup closeButton={false} className="shop-popup">
            <ShopPinPopup pin={pin} />
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export { MIN_ZOOM }
