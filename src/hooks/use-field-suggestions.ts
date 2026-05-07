import { useEffect, useReducer, useRef } from 'react'
import type { BoundedSuggestion } from '@/lib/geo'

type State = { suggestions: BoundedSuggestion[]; open: boolean }
type Action = { type: 'set'; items: BoundedSuggestion[] } | { type: 'close' }

function reducer(s: State, a: Action): State {
  if (a.type === 'set') return { suggestions: a.items, open: a.items.length > 0 }
  return { ...s, open: false }
}

export function useFieldSuggestions(
  query: string,
  fetcher: (q: string) => Promise<BoundedSuggestion[]>,
) {
  const [{ suggestions, open }, dispatch] = useReducer(reducer, { suggestions: [], open: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      dispatch({ type: 'close' })
      return
    }
    timerRef.current = setTimeout(() => {
      void fetcher(query).then((items) => dispatch({ type: 'set', items }))
    }, 350)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, fetcher])

  return { suggestions, open, close: () => dispatch({ type: 'close' }) }
}
