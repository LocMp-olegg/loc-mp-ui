import { useEffect, useReducer, useRef } from 'react'
import { suggestAddress, type GeoSuggestion } from '@/lib/geo'

type SugState = { suggestions: GeoSuggestion[]; showSuggestions: boolean }

export type SugAction =
  | { type: 'set'; items: GeoSuggestion[] }
  | { type: 'clear' }
  | { type: 'hide' }

function sugReducer(s: SugState, a: SugAction): SugState {
  if (a.type === 'set') return { suggestions: a.items, showSuggestions: a.items.length > 0 }
  if (a.type === 'hide') return { ...s, showSuggestions: false }
  return { suggestions: [], showSuggestions: false }
}

export function useAddressSuggestions(search: string, label: string) {
  const [{ suggestions, showSuggestions }, dispatchSug] = useReducer(sugReducer, {
    suggestions: [],
    showSuggestions: false,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!search.trim() || search === label) {
      dispatchSug({ type: 'clear' })
      return
    }
    debounceRef.current = setTimeout(async () => {
      const results = await suggestAddress(search)
      dispatchSug({ type: 'set', items: results })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, label])

  return { suggestions, showSuggestions, dispatchSug }
}
