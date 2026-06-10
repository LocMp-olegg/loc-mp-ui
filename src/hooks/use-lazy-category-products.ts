import { useReducer, useEffect } from 'react'
import { fetchCategoryProducts } from '@/lib/catalog'
import { useUserLocation } from '@/contexts/location-context'
import type { ProductFilter } from '@/lib/catalog'
import type { Product } from '@/types/product'

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

let inFlight = 0
const MAX_CONCURRENT = 3
const waitQueue: Array<() => void> = []

function checkout(): Promise<() => void> {
  return new Promise((resolve) => {
    const tryRun = () => {
      if (inFlight < MAX_CONCURRENT) {
        inFlight++
        resolve(() => {
          inFlight--
          waitQueue.shift()?.()
        })
      } else {
        waitQueue.push(tryRun)
      }
    }
    tryRun()
  })
}

export function useLazyCategoryProducts(categoryId: string, filter: ProductFilter = {}): State {
  const [state, dispatch] = useReducer(reducer, { products: [], loading: false, fetched: false })
  const { location } = useUserLocation()
  const { sort, minPrice, maxPrice, isInStock } = filter

  useEffect(() => {
    let cancelled = false

    checkout().then((release) => {
      if (cancelled) {
        release()
        return
      }

      dispatch({ type: 'loading' })

      const geo = location
        ? { lat: location.lat, lng: location.lng, radiusKm: location.radius }
        : undefined

      fetchCategoryProducts(categoryId, geo, { sort, minPrice, maxPrice, isInStock })
        .then((products) => {
          release()
          if (!cancelled) dispatch({ type: 'loaded', products })
        })
        .catch(() => {
          release()
          if (!cancelled) dispatch({ type: 'error' })
        })
    })

    return () => {
      cancelled = true
    }
  }, [categoryId, location, sort, minPrice, maxPrice, isInStock])

  return state
}
