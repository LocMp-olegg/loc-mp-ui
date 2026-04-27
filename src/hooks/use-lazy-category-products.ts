import { useReducer, useState, useEffect, useRef } from 'react'
import { fetchCategoryProducts } from '@/lib/catalog'
import { useUserLocation } from '@/contexts/location-context'
import type { ProductFilter } from '@/lib/catalog'
import type { Product } from '@/types/product'
import * as React from 'react'

interface State {
  products: Product[]
  loading: boolean
  fetched: boolean
}

type Action = { type: 'loading' } | { type: 'loaded'; products: Product[] } | { type: 'error' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true }
    case 'loaded':
      return { products: action.products, loading: false, fetched: true }
    case 'error':
      return { products: [], loading: false, fetched: true }
  }
}

export function useLazyCategoryProducts(
  categoryId: string,
  filter: ProductFilter = {},
): State & { ref: React.RefObject<HTMLElement | null>; visible: boolean } {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [state, dispatch] = useReducer(reducer, { products: [], loading: false, fetched: false })
  const { location } = useUserLocation()
  const { sort, minPrice, maxPrice, isInStock } = filter

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let cancelled = false

    dispatch({ type: 'loading' })

    const geo = location
      ? { lat: location.lat, lng: location.lng, radiusKm: location.radius }
      : undefined

    fetchCategoryProducts(categoryId, geo, { sort, minPrice, maxPrice, isInStock })
      .then((products) => {
        if (!cancelled) dispatch({ type: 'loaded', products })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [visible, categoryId, location, sort, minPrice, maxPrice, isInStock])

  return { ...state, ref, visible }
}
