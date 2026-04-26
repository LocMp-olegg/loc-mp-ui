const KEY = import.meta.env.VITE_DADATA_KEY as string
const SECRET = import.meta.env.VITE_DADATA_SECRET as string

export interface GeoSuggestion {
  label: string
  lat: number
  lng: number
}

interface DaDataAddressData {
  geo_lat?: string | null
  geo_lon?: string | null
  city_district?: string | null
  city_area?: string | null
  settlement?: string | null
  city?: string | null
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
