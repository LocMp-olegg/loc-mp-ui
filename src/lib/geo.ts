const KEY = import.meta.env.VITE_DADATA_KEY as string
const SECRET = import.meta.env.VITE_DADATA_SECRET as string

export interface GeoSuggestion {
  label: string
  lat: number
  lng: number
  city?: string
  street?: string
  houseNumber?: string
  apartment?: string
}

interface DaDataAddressData {
  geo_lat?: string | null
  geo_lon?: string | null
  city_district?: string | null
  city_area?: string | null
  settlement?: string | null
  city?: string | null
  street?: string | null
  street_with_type?: string | null
  house?: string | null
  flat?: string | null
}

export interface BoundedSuggestion {
  label: string
  value: string
  lat?: number
  lng?: number
  city?: string
  street?: string
  houseNumber?: string
}

interface DaDataSuggestion {
  value: string
  data: DaDataAddressData
}

export async function suggestAddress(query: string): Promise<GeoSuggestion[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${KEY}` },
        body: JSON.stringify({ query, count: 6, language: 'ru' }),
      },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { suggestions?: DaDataSuggestion[] }
    return (data.suggestions ?? [])
      .filter((s) => s.data?.geo_lat && s.data?.geo_lon)
      .map((s) => ({
        label: s.value,
        lat: parseFloat(s.data.geo_lat!),
        lng: parseFloat(s.data.geo_lon!),
        city: s.data.city ?? s.data.settlement ?? undefined,
        street: s.data.street ?? undefined,
        houseNumber: s.data.house ?? undefined,
        apartment: s.data.flat ?? undefined,
      }))
  } catch {
    return []
  }
}

export async function reverseGeocodeStructured(
  lat: number,
  lng: number,
): Promise<GeoSuggestion | null> {
  try {
    const res = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${KEY}`,
          'X-Secret': SECRET,
        },
        body: JSON.stringify({ lat, lon: lng, count: 1 }),
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { suggestions?: DaDataSuggestion[] }
    const s = data.suggestions?.[0]
    if (!s?.data?.geo_lat || !s.data.geo_lon) return null
    return {
      label: s.value,
      lat: parseFloat(s.data.geo_lat),
      lng: parseFloat(s.data.geo_lon),
      city: s.data.city ?? s.data.settlement ?? undefined,
      street: s.data.street ?? undefined,
      houseNumber: s.data.house ?? undefined,
      apartment: s.data.flat ?? undefined,
    }
  } catch {
    return null
  }
}

export async function suggestCity(query: string): Promise<BoundedSuggestion[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${KEY}` },
        body: JSON.stringify({
          query,
          count: 6,
          language: 'ru',
          from_bound: { value: 'city' },
          to_bound: { value: 'city' },
        }),
      },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { suggestions?: DaDataSuggestion[] }
    return (data.suggestions ?? []).map((s) => ({
      label: s.value,
      value: s.data.city ?? s.data.settlement ?? s.value,
    }))
  } catch {
    return []
  }
}

export async function suggestStreet(city: string, query: string): Promise<BoundedSuggestion[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${KEY}` },
        body: JSON.stringify({
          query,
          count: 6,
          language: 'ru',
          from_bound: { value: 'street' },
          to_bound: { value: 'street' },
          ...(city.trim() ? { locations: [{ city }] } : {}),
        }),
      },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { suggestions?: DaDataSuggestion[] }
    return (data.suggestions ?? []).map((s) => ({
      label: s.data.street_with_type ?? s.data.street ?? s.value,
      value: s.data.street ?? s.value,
    }))
  } catch {
    return []
  }
}

export async function suggestHouse(
  city: string,
  street: string,
  query: string,
): Promise<BoundedSuggestion[]> {
  if (!query.trim()) return []
  try {
    const location: Record<string, string> = {}
    if (city.trim()) location.city = city
    if (street.trim()) location.street = street
    const res = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${KEY}` },
        body: JSON.stringify({
          query,
          count: 6,
          language: 'ru',
          from_bound: { value: 'house' },
          to_bound: { value: 'house' },
          ...(Object.keys(location).length ? { locations: [location] } : {}),
        }),
      },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { suggestions?: DaDataSuggestion[] }
    return (data.suggestions ?? [])
      .filter((s) => s.data.geo_lat && s.data.geo_lon)
      .map((s) => ({
        label: s.value,
        value: s.data.house ?? query,
        lat: parseFloat(s.data.geo_lat!),
        lng: parseFloat(s.data.geo_lon!),
        city: s.data.city ?? s.data.settlement ?? undefined,
        street: s.data.street ?? undefined,
        houseNumber: s.data.house ?? undefined,
      }))
  } catch {
    return []
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${KEY}`,
          'X-Secret': SECRET,
        },
        body: JSON.stringify({ lat, lon: lng, count: 1 }),
      },
    )
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    const data = (await res.json()) as { suggestions?: DaDataSuggestion[] }
    const d = data.suggestions?.[0]?.data
    if (!d) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    return (
      d.city_district ??
      d.city_area ??
      d.settlement ??
      d.city ??
      `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    )
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}
