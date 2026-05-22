import { useReducer, useRef, useCallback } from 'react'
import { ShopsService } from '@/api/catalog'
import type { ShopMapDto } from '@/api/catalog'

export interface ShopPin {
  shopId: string
  name: string
  lat: number
  lng: number
  photo: string | null
  rating: number
  reviewCount: number
  serviceRadiusKm: number | null
}

export const MIN_ZOOM = 10

function dtoToPin(dto: ShopMapDto): ShopPin | null {
  if (!dto.id || dto.latitude == null || dto.longitude == null || dto.isActive === false)
    return null
  return {
    shopId: dto.id,
    name: dto.name ?? 'Магазин',
    lat: dto.latitude,
    lng: dto.longitude,
    photo: dto.avatarUrl ?? null,
    rating: dto.averageRating ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    serviceRadiusKm: dto.serviceRadiusKm ?? null,
  }
}

type State = { loading: boolean; error: string | null; pinMap: Map<string, ShopPin> }
type Action = { type: 'start' } | { type: 'append'; dtos: ShopMapDto[] } | { type: 'error' }

const INITIAL: State = { loading: false, error: null, pinMap: new Map() }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, error: null }
    case 'append': {
      const next = new Map(state.pinMap)
      for (const dto of action.dtos) {
        const pin = dtoToPin(dto)
        if (pin) next.set(pin.shopId, pin)
      }
      return { loading: false, error: null, pinMap: next }
    }
    case 'error':
      return { ...state, loading: false, error: 'Не удалось загрузить магазины' }
  }
}

export function useShopsMap() {
  const [{ loading, error, pinMap }, dispatch] = useReducer(reducer, INITIAL)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchForBounds = useCallback(
    (swLat: number, swLon: number, neLat: number, neLon: number, zoom: number) => {
      if (zoom < MIN_ZOOM) return
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'start' })
        ShopsService.getApiCatalogShopsMap({ swLat, swLon, neLat, neLon })
          .then((dtos) => dispatch({ type: 'append', dtos }))
          .catch(() => dispatch({ type: 'error' }))
      }, 350)
    },
    [],
  )

  return { loading, error, pins: [...pinMap.values()], fetchForBounds }
}
