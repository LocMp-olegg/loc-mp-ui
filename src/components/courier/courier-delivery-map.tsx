import { useEffect, useReducer, useRef } from 'react'
import { MapContainer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { ThemedTileLayer } from '@/lib/map-utils'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function dot(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -11],
  })
}

const iconShop = dot('#f4a261')
const iconDelivery = dot('#e76f51')
const iconCourier = dot('#4f86f7')

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current || points.length === 0) return
    fitted.current = true
    if (points.length === 1) {
      map.setView(points[0], 14)
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 })
    }
  }, [map, points])
  return null
}

async function fetchRoute(
  from: [number, number],
  to: [number, number],
): Promise<[number, number][] | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      routes?: { geometry?: { coordinates?: [number, number][] } }[]
    }
    const coords = data.routes?.[0]?.geometry?.coordinates
    return coords ? coords.map(([lng, lat]) => [lat, lng]) : null
  } catch {
    return null
  }
}

interface CourierDeliveryMapProps {
  shopLat?: number | null
  shopLng?: number | null
  shopName?: string | null
  deliveryLat?: number | null
  deliveryLng?: number | null
  deliveryAddress?: string | null
  recipientName?: string | null
  courierLat?: number | null
  courierLng?: number | null
}

type Route = [number, number][] | null
type RoutesState = { shopToDelivery: Route; courierToShop: Route }
type RoutesAction =
  | { type: 'setShopToDelivery'; route: Route }
  | { type: 'setCourierToShop'; route: Route }

function routesReducer(s: RoutesState, a: RoutesAction): RoutesState {
  switch (a.type) {
    case 'setShopToDelivery':
      return { ...s, shopToDelivery: a.route }
    case 'setCourierToShop':
      return { ...s, courierToShop: a.route }
  }
}

export function CourierDeliveryMap({
  shopLat,
  shopLng,
  shopName,
  deliveryLat,
  deliveryLng,
  deliveryAddress,
  recipientName,
  courierLat,
  courierLng,
}: CourierDeliveryMapProps) {
  const [routes, dispatchRoutes] = useReducer(routesReducer, {
    shopToDelivery: null,
    courierToShop: null,
  })
  const shopToDeliveryRoute = routes.shopToDelivery
  const courierToShopRoute = routes.courierToShop

  const hasShop = shopLat != null && shopLng != null
  const hasDelivery = deliveryLat != null && deliveryLng != null
  const hasCourier = courierLat != null && courierLng != null

  const allPoints: [number, number][] = [
    ...(hasCourier ? [[courierLat, courierLng] as [number, number]] : []),
    ...(hasShop ? [[shopLat, shopLng] as [number, number]] : []),
    ...(hasDelivery ? [[deliveryLat, deliveryLng] as [number, number]] : []),
  ]

  useEffect(() => {
    if (!hasShop || !hasDelivery) {
      dispatchRoutes({ type: 'setShopToDelivery', route: null })
      return
    }
    let cancelled = false
    fetchRoute([shopLat, shopLng], [deliveryLat, deliveryLng]).then((r) => {
      if (!cancelled) dispatchRoutes({ type: 'setShopToDelivery', route: r })
    })
    return () => {
      cancelled = true
    }
  }, [hasShop, hasDelivery, shopLat, shopLng, deliveryLat, deliveryLng])

  useEffect(() => {
    if (!hasCourier || !hasShop) {
      dispatchRoutes({ type: 'setCourierToShop', route: null })
      return
    }
    let cancelled = false
    fetchRoute([courierLat, courierLng], [shopLat, shopLng]).then((r) => {
      if (!cancelled) dispatchRoutes({ type: 'setCourierToShop', route: r })
    })
    return () => {
      cancelled = true
    }
  }, [hasCourier, hasShop, courierLat, courierLng, shopLat, shopLng])

  if (allPoints.length === 0) return null

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 260 }}>
      <MapContainer
        center={allPoints[0]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom
        attributionControl={false}
      >
        <ThemedTileLayer />
        <FitBounds points={allPoints} />

        {hasCourier &&
          hasShop &&
          (courierToShopRoute ? (
            <Polyline
              positions={courierToShopRoute}
              pathOptions={{ color: '#4f86f7', weight: 3, opacity: 0.75 }}
            />
          ) : (
            <Polyline
              positions={[
                [courierLat, courierLng],
                [shopLat, shopLng],
              ]}
              pathOptions={{ color: '#4f86f7', weight: 2, opacity: 0.5, dashArray: '6 6' }}
            />
          ))}

        {hasShop &&
          hasDelivery &&
          (shopToDeliveryRoute ? (
            <Polyline
              positions={shopToDeliveryRoute}
              pathOptions={{ color: '#2a9d8f', weight: 4, opacity: 0.85 }}
            />
          ) : (
            <Polyline
              positions={[
                [shopLat, shopLng],
                [deliveryLat, deliveryLng],
              ]}
              pathOptions={{ color: '#2a9d8f', weight: 3, opacity: 0.5, dashArray: '6 6' }}
            />
          ))}

        {hasCourier && (
          <Marker position={[courierLat, courierLng]} icon={iconCourier}>
            <Popup closeButton={false} className="shop-popup">
              <div style={{ padding: '10px 12px', color: 'var(--foreground)' }}>
                <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>Вы</p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                  Базовая точка
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {hasShop && (
          <Marker position={[shopLat, shopLng]} icon={iconShop}>
            <Popup closeButton={false} className="shop-popup">
              <div style={{ padding: '10px 12px', color: 'var(--foreground)' }}>
                <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{shopName ?? 'Магазин'}</p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                  Забрать здесь
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {hasDelivery && (
          <Marker position={[deliveryLat, deliveryLng]} icon={iconDelivery}>
            <Popup closeButton={false} className="shop-popup">
              <div style={{ padding: '10px 12px', color: 'var(--foreground)' }}>
                {recipientName && (
                  <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{recipientName}</p>
                )}
                {deliveryAddress && (
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                    {deliveryAddress}
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                  Доставить сюда
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
