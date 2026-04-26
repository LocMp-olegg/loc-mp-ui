import { useReducer, useState, useEffect, useRef } from 'react'
import { fetchCategoryProducts } from '@/lib/catalog'
import { useUserLocation } from '@/contexts/location-context'
import type { Product } from '@/types/product'
import * as React from 'react'

interface State {
  products: Product[]
  loading: boolean
}

type Action = { type: 'loading' } | { type: 'loaded'; products: Product[] } | { type: 'error' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true }
    case 'loaded':
      return { products: action.products, loading: false }
    case 'error':
      return { products: [], loading: false }
  }
}

export function useLazyCategoryProducts(
  categoryId: string,
): State & { ref: React.RefObject<HTMLElement | null> } {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [state, dispatch] = useReducer(reducer, { products: [], loading: true })
  const { location } = useUserLocation()

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

    fetchCategoryProducts(categoryId, geo)
      .then((products) => {
        if (!cancelled) dispatch({ type: 'loaded', products })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [visible, categoryId, location])

  return { ...state, ref }
}
