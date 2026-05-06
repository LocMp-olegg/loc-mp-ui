import { useReducer, useState, useEffect, useCallback, useRef } from 'react'
import { ProductsService } from '@/api/catalog'
import type { ProductSummaryDto, ProductDto, ProductSortBy } from '@/api/catalog'

// ── useMyProducts (list) ──────────────────────────────────────────────────────

type ListState = {
  products: ProductSummaryDto[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  totalCount: number
}
type ListAction =
  | { type: 'loading' }
  | {
      type: 'success'
      products: ProductSummaryDto[]
      hasNextPage: boolean
      totalCount: number
      append: boolean
    }
  | { type: 'error'; message: string }

function listReducer(s: ListState, a: ListAction): ListState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success')
    return {
      products: a.append ? [...s.products, ...a.products] : a.products,
      loading: false,
      error: null,
      hasNextPage: a.hasNextPage,
      totalCount: a.totalCount,
    }
  return { ...s, loading: false, error: a.message }
}

export function useMyProducts({
  shopId,
  isActive,
  isInStock,
  sort,
  pageSize = 20,
}: {
  shopId?: string
  isActive?: boolean
  isInStock?: boolean
  sort?: ProductSortBy
  pageSize?: number
}) {
  const [state, dispatch] = useReducer(listReducer, {
    products: [],
    loading: true,
    error: null,
    hasNextPage: false,
    totalCount: 0,
  })
  const [reloadKey, setReloadKey] = useState(0)
  const pageRef = useRef(1)
  const fetchingMoreRef = useRef(false)

  const filtersRef = useRef({ shopId, isActive, isInStock, sort, pageSize })
  useEffect(() => {
    filtersRef.current = { shopId, isActive, isInStock, sort, pageSize }
  })

  const filterKey = `${shopId}|${String(isActive)}|${String(isInStock)}|${sort}|${pageSize}`

  useEffect(() => {
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'loading' })
    const f = filtersRef.current
    ProductsService.getApiCatalogProductsMy({
      shopId: f.shopId,
      isActive: f.isActive,
      isInStock: f.isInStock || undefined,
      sort: f.sort,
      page: 1,
      pageSize: f.pageSize,
    })
      .then((data) => {
        if (!cancelled)
          dispatch({
            type: 'success',
            products: data.items ?? [],
            hasNextPage: pageRef.current < (data.totalPages ?? 1),
            totalCount: data.totalCount ?? 0,
            append: false,
          })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить товары' })
      })
    return () => {
      cancelled = true
    }
  }, [filterKey, reloadKey])

  const loadMore = useCallback(() => {
    if (fetchingMoreRef.current) return
    fetchingMoreRef.current = true
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    dispatch({ type: 'loading' })
    const f = filtersRef.current
    ProductsService.getApiCatalogProductsMy({
      shopId: f.shopId,
      isActive: f.isActive,
      isInStock: f.isInStock || undefined,
      sort: f.sort,
      page: nextPage,
      pageSize: f.pageSize,
    })
      .then((data) => {
        fetchingMoreRef.current = false
        dispatch({
          type: 'success',
          products: data.items ?? [],
          hasNextPage: pageRef.current < (data.totalPages ?? 1),
          totalCount: data.totalCount ?? 0,
          append: true,
        })
      })
      .catch(() => {
        fetchingMoreRef.current = false
        dispatch({ type: 'error', message: 'Не удалось загрузить товары' })
      })
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { ...state, loadMore, reload }
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
