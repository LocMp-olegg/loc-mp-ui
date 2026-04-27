import { useReducer, useEffect, useRef, useCallback } from 'react'
import { fetchCategoryById } from '@/lib/catalog'
import type { ProductFilter } from '@/lib/catalog'
import type { Product } from '@/types/product'

interface CategoryInfo {
  id: string
  name: string
  emoji: string
}

interface State {
  info: CategoryInfo | null
  products: Product[]
  hasNextPage: boolean
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'fetching' }
  | {
      type: 'fetched'
      info: CategoryInfo
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

const INITIAL_STATE: State = {
  info: null,
  products: [],
  hasNextPage: false,
  loading: false,
  error: null,
}

export function useCatalogCategory(categoryId: string, filter: ProductFilter = {}) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const pageRef = useRef(1)
  const { sort, minPrice, maxPrice, isInStock } = filter

  // Reset and fetch page 1 when category or filter changes
  useEffect(() => {
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'fetching' })

    fetchCategoryById(categoryId, 1, 20, { sort, minPrice, maxPrice, isInStock })
      .then((data) => {
        if (!cancelled)
          dispatch({
            type: 'fetched',
            info: { id: data.id, name: data.name, emoji: data.emoji },
            products: data.products,
            hasNextPage: data.hasNextPage,
            append: false,
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
  }, [categoryId, sort, minPrice, maxPrice, isInStock])

  const loadMore = useCallback(() => {
    pageRef.current += 1
    dispatch({ type: 'fetching' })

    fetchCategoryById(categoryId, pageRef.current, 20, { sort, minPrice, maxPrice, isInStock })
      .then((data) =>
        dispatch({
          type: 'fetched',
          info: { id: data.id, name: data.name, emoji: data.emoji },
          products: data.products,
          hasNextPage: data.hasNextPage,
          append: true,
        }),
      )
      .catch((err: unknown) =>
        dispatch({
          type: 'error',
          message: err instanceof Error ? err.message : 'Ошибка загрузки',
        }),
      )
  }, [categoryId, sort, minPrice, maxPrice, isInStock])

  const data = state.info ? { ...state.info, products: state.products } : null

  return {
    data,
    loading: state.loading,
    error: state.error,
    hasNextPage: state.hasNextPage,
    loadMore,
  }
}
