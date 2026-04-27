import { useReducer, useState, useEffect } from 'react'
import { fetchCategoryById } from '@/lib/catalog'
import type { Product } from '@/types/product'

interface CategoryData {
  id: string
  name: string
  emoji: string
}

interface State {
  info: CategoryData | null
  products: Product[]
  hasNextPage: boolean
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'fetching' }
  | {
      type: 'fetched'
      info: CategoryData
      products: Product[]
      hasNextPage: boolean
      append: boolean
    }
  | { type: 'error'; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetching':
      return { ...state, loading: true }
    case 'fetched':
      return {
        info: action.info,
        products: action.append ? [...state.products, ...action.products] : action.products,
        hasNextPage: action.hasNextPage,
        loading: false,
        error: null,
      }
    case 'error':
      return { ...state, loading: false, error: action.message }
  }
}

export function useCatalogCategory(categoryId: string) {
  const [state, dispatch] = useReducer(reducer, {
    info: null,
    products: [],
    hasNextPage: false,
    loading: false,
    error: null,
  })
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    const append = page > 1

    dispatch({ type: 'fetching' })

    fetchCategoryById(categoryId, page)
      .then((data) => {
        if (!cancelled)
          dispatch({
            type: 'fetched',
            info: { id: data.id, name: data.name, emoji: data.emoji },
            products: data.products,
            hasNextPage: data.hasNextPage,
            append,
          })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          dispatch({
            type: 'error',
            message: err instanceof Error ? err.message : 'Ошибка загрузки',
          })
      })

    return () => {
      cancelled = true
    }
  }, [categoryId, page])

  const data = state.info ? { ...state.info, products: state.products } : null

  return {
    data,
    loading: state.loading,
    error: state.error,
    hasNextPage: state.hasNextPage,
    loadMore: () => setPage((p) => p + 1),
  }
}
