import { useReducer, useState, useEffect, useCallback } from 'react'
import { ProductsService } from '@/api/catalog'
import type { ProductSummaryDto, ProductDto, ProductSortBy } from '@/api/catalog'

// ── useMyProducts (list) ──────────────────────────────────────────────────────

type ListState = {
  products: ProductSummaryDto[]
  loading: boolean
  error: string | null
  totalPages: number
  totalCount: number
}
type ListAction =
  | { type: 'loading' }
  | { type: 'success'; products: ProductSummaryDto[]; totalPages: number; totalCount: number }
  | { type: 'error'; message: string }

function listReducer(s: ListState, a: ListAction): ListState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success')
    return {
      products: a.products,
      loading: false,
      error: null,
      totalPages: a.totalPages,
      totalCount: a.totalCount,
    }
  return { ...s, loading: false, error: a.message }
}

export function useMyProducts({
  shopId,
  isActive,
  isInStock,
  sort,
  page,
}: {
  shopId?: string
  isActive?: boolean
  isInStock?: boolean
  sort?: ProductSortBy
  page: number
}) {
  const [state, dispatch] = useReducer(listReducer, {
    products: [],
    loading: true,
    error: null,
    totalPages: 1,
    totalCount: 0,
  })
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    ProductsService.getApiCatalogProductsMy({
      shopId: shopId || undefined,
      isActive,
      isInStock: isInStock || undefined,
      sort,
      page,
      pageSize: 20,
    })
      .then((data) => {
        if (!cancelled)
          dispatch({
            type: 'success',
            products: data.items ?? [],
            totalPages: data.totalPages ?? 1,
            totalCount: data.totalCount ?? 0,
          })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить товары' })
      })
    return () => {
      cancelled = true
    }
  }, [shopId, isActive, isInStock, sort, page, version])

  return { ...state, reload }
}

// ── useProductById ────────────────────────────────────────────────────────────

type ProductState = { product: ProductDto | null; loading: boolean; error: string | null }
type ProductAction =
  | { type: 'loading' }
  | { type: 'success'; product: ProductDto }
  | { type: 'error'; message: string }
  | { type: 'set'; product: ProductDto }

function productReducer(s: ProductState, a: ProductAction): ProductState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { product: a.product, loading: false, error: null }
  if (a.type === 'set') return { ...s, product: a.product }
  return { ...s, loading: false, error: a.message }
}

export function useProductById(productId: string | undefined) {
  const [state, dispatch] = useReducer(productReducer, {
    product: null,
    loading: !!productId,
    error: null,
  })
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    dispatch({ type: 'loading' })
    ProductsService.getApiCatalogProducts({ id: productId })
      .then((p) => {
        if (!cancelled) dispatch({ type: 'success', product: p })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить товар' })
      })
    return () => {
      cancelled = true
    }
  }, [productId, version])

  const setProduct = useCallback((product: ProductDto) => dispatch({ type: 'set', product }), [])

  return { ...state, setProduct, reload }
}
