import { useCallback } from 'react'
import { reverseGeocode } from '@/lib/geo'

interface ApplyPointOptions {
  setLat: (lat: number) => void
  setLng: (lng: number) => void
  setRecenter: (v: boolean) => void
  setLabel: (label: string) => void
  setSearch: (search: string) => void
  setLoadingGeo: (loading: boolean) => void
}

export function useApplyPoint({
  setLat,
  setLng,
  setRecenter,
  setLabel,
  setSearch,
  setLoadingGeo,
}: ApplyPointOptions) {
  return useCallback(
    async (newLat: number, newLng: number, knownLabel?: string) => {
      setLat(newLat)
      setLng(newLng)
      setRecenter(true)
      if (knownLabel) {
        setLabel(knownLabel)
        setSearch(knownLabel)
      } else {
        setLoadingGeo(true)
        const name = await reverseGeocode(newLat, newLng)
        setLabel(name)
        setSearch(name)
        setLoadingGeo(false)
      }
    },
    [setLat, setLng, setRecenter, setLabel, setSearch, setLoadingGeo],
  )
}
