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

  return { handleSuggestionSelect }
}
