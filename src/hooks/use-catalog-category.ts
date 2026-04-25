import { useState, useEffect } from 'react'
import { fetchCategoryById } from '@/lib/catalog'
import type { Product } from '@/types/product'

interface CategoryData {
  id: string
  name: string
  emoji: string
  products: Product[]
}

interface State {
  data: CategoryData | null
  error: string | null
  loadedForId: string | null
}

export function useCatalogCategory(categoryId: string | undefined) {
  const [state, setState] = useState<State>({ data: null, error: null, loadedForId: null })

  const loading = Boolean(categoryId) && state.loadedForId !== categoryId

  useEffect(() => {
    if (!categoryId) return

    let cancelled = false

    fetchCategoryById(categoryId)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loadedForId: categoryId })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            error: err instanceof Error ? err.message : 'Ошибка загрузки',
            loadedForId: categoryId,
          })
      })

    return () => {
      cancelled = true
    }
  }, [categoryId])

  return {
    data: state.data,
    loading,
    error: categoryId ? state.error : 'Категория не найдена',
  }
}
