import { useCallback, type Dispatch } from 'react'
import type { GeoSuggestion } from '@/lib/geo'
import type { SugAction } from '@/hooks/use-address-suggestions'

interface MapHandlersOptions {
  applyPoint: (lat: number, lng: number, label?: string) => Promise<void>
  dispatchSug: Dispatch<SugAction>
}

export function useMapHandlers({ applyPoint, dispatchSug }: MapHandlersOptions) {
  const handleSuggestionSelect = useCallback(
    (s: GeoSuggestion) => {
      dispatchSug({ type: 'clear' })
      void applyPoint(s.lat, s.lng, s.label)
    },
    [applyPoint, dispatchSug],
  )

  const handleGeolocate = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => void applyPoint(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { timeout: 5000 },
    )
  }, [applyPoint])

  return { handleSuggestionSelect, handleGeolocate }
}
