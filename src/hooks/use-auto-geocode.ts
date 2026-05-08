import { useReducer, useEffect } from 'react'
import { suggestAddress } from '@/lib/geo'

export type GeoLookupStatus = 'idle' | 'loading' | 'notFound'

function reducer(
  _: GeoLookupStatus,
  action: 'start' | 'found' | 'fail' | 'reset',
): GeoLookupStatus {
  if (action === 'start') return 'loading'
  if (action === 'found' || action === 'reset') return 'idle'
  return 'notFound'
}

interface Options {
  city: string
  street: string
  houseNumber: string
  /** When true, skip auto-geocoding (coordinates already set) */
  hasCoordinates: boolean
  onFound: (lat: number, lng: number) => void
}

export function useAutoGeocode({ city, street, houseNumber, hasCoordinates, onFound }: Options) {
  const [geocodeLookup, dispatchGeocode] = useReducer(reducer, 'idle')

  useEffect(() => {
    if (hasCoordinates) {
      dispatchGeocode('reset')
      return
    }
    if (!city.trim() || !street.trim() || !houseNumber.trim()) {
      dispatchGeocode('reset')
      return
    }
    dispatchGeocode('start')
    let cancelled = false
    const query = `${houseNumber.trim()}, ${street.trim()}, ${city.trim()}`
    const timer = setTimeout(() => {
      void suggestAddress(query).then((results) => {
        if (cancelled) return
        if (results.length > 0) {
          onFound(results[0].lat, results[0].lng)
          dispatchGeocode('found')
        } else {
          dispatchGeocode('fail')
        }
      })
    }, 800)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [city, street, houseNumber, hasCoordinates, onFound])

  return { geocodeLookup, dispatchGeocode }
}
