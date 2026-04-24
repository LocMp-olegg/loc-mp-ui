import { useState, useEffect } from 'react'
import { fetchCatalogStructure } from '@/lib/catalog'
import type { CatalogStructure } from '@/lib/catalog'

interface State {
  data: CatalogStructure | null
  loading: boolean
  error: string | null
}

export function useCatalogHome(): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    fetchCatalogStructure()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Ошибка загрузки',
          })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
