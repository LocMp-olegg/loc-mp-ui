import { useState, useCallback } from 'react'
import { useFieldSuggestions } from '@/hooks/use-field-suggestions'
import { suggestCity, suggestStreet, suggestHouse } from '@/lib/geo'
import type { GeoSuggestion, BoundedSuggestion } from '@/lib/geo'

export interface AddressFields {
  city: string
  street: string
  houseNumber: string
  apartment: string
  entrance: string
  floor: string
}

interface Options {
  initial?: Partial<AddressFields>
  onCoordinatesReset?: () => void
  onHouseCoordinates?: (lat: number, lng: number, label: string) => void
}

export function useAddressFormFields({
  initial,
  onCoordinatesReset,
  onHouseCoordinates,
}: Options = {}) {
  const [city, setCity] = useState(initial?.city ?? '')
  const [street, setStreet] = useState(initial?.street ?? '')
  const [houseNumber, setHouseNumber] = useState(initial?.houseNumber ?? '')
  const [apartment, setApartment] = useState(initial?.apartment ?? '')
  const [entrance, setEntrance] = useState(initial?.entrance ?? '')
  const [floor, setFloor] = useState(initial?.floor ?? '')

  const [activeField, setActiveField] = useState<'city' | 'street' | 'house' | null>(null)

  const cityQ = activeField === 'city' ? city : ''
  const streetQ = activeField === 'street' ? [city, street].filter(Boolean).join(' ') : ''
  const houseQ =
    activeField === 'house' ? [city, street, houseNumber].filter(Boolean).join(' ') : ''

  const cityFetcher = useCallback((q: string) => suggestCity(q), [])
  const streetFetcher = useCallback((q: string) => suggestStreet(city, q), [city])
  const houseFetcher = useCallback((q: string) => suggestHouse(city, street, q), [city, street])

  const citySug = useFieldSuggestions(cityQ, cityFetcher)
  const streetSug = useFieldSuggestions(streetQ, streetFetcher)
  const houseSug = useFieldSuggestions(houseQ, houseFetcher)

  const applyGeoSuggestion = useCallback((s: GeoSuggestion) => {
    if (s.city) setCity(s.city)
    if (s.street) setStreet(s.street)
    if (s.houseNumber) setHouseNumber(s.houseNumber)
    setApartment(s.apartment ?? '')
    setEntrance('')
    setFloor('')
  }, [])

  const handleCitySelect = useCallback(
    (s: BoundedSuggestion) => {
      setActiveField(null)
      citySug.close()
      setCity(s.value)
    },
    [citySug],
  )

  const handleStreetSelect = useCallback(
    (s: BoundedSuggestion) => {
      setActiveField(null)
      streetSug.close()
      setStreet(s.value)
      onCoordinatesReset?.()
    },
    [streetSug, onCoordinatesReset],
  )

  const handleHouseSelect = useCallback(
    (s: BoundedSuggestion) => {
      setActiveField(null)
      houseSug.close()
      setHouseNumber(s.value)
      if (s.city) setCity(s.city)
      if (s.street) setStreet(s.street)
      if (s.lat != null && s.lng != null) {
        onHouseCoordinates?.(s.lat, s.lng, s.label)
      }
    },
    [houseSug, onHouseCoordinates],
  )

  const fields: AddressFields = { city, street, houseNumber, apartment, entrance, floor }

  return {
    fields,
    city,
    setCity,
    street,
    setStreet,
    houseNumber,
    setHouseNumber,
    apartment,
    setApartment,
    entrance,
    setEntrance,
    floor,
    setFloor,
    activeField,
    setActiveField,
    citySug,
    streetSug,
    houseSug,
    applyGeoSuggestion,
    handleCitySelect,
    handleStreetSelect,
    handleHouseSelect,
  }
}
