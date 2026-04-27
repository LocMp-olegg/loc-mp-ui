import { useReducer, useEffect, useRef, useCallback } from 'react'
import { fetchShopProducts } from '@/lib/catalog'
import type { ShopProductFilter } from '@/lib/catalog'
import type { Product } from '@/types/product'

interface State {
  products: Product[]
  loading: boolean
  hasNextPage: boolean
}

type Action =
  | { type: 'loading' }
  | { type: 'loaded'; products: Product[]; hasNextPage: boolean; append: boolean }
  | { type: 'error' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true }
    case 'loaded':
      return {
        products: action.append ? [...state.products, ...action.products] : action.products,
        loading: false,
        hasNextPage: action.hasNextPage,
      }
    case 'error':
      return { ...state, loading: false }
  }
}

function applyRootFilter(
  products: Product[],
  rootCategoryId: string,
  leafToRoot: Map<string, string>,
): Product[] {
  return products.filter((p) => leafToRoot.get(p.categoryId) === rootCategoryId)
}

export function useShopFilteredProducts(
  shopId: string,
  filter: ShopProductFilter,
  leafToRoot: Map<string, string> = new Map(),
) {
  const [state, dispatch] = useReducer(reducer, {
    products: [],
    loading: false,
    hasNextPage: false,
  })

  const pageRef = useRef(1)

  // When rootCategoryId is set, fetch without categoryId and post-filter client-side
  const { categoryId, rootCategoryId, minPrice, maxPrice, isInStock, sort, search } = filter
  const apiCategoryId = rootCategoryId ? undefined : categoryId

  useEffect(() => {
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'loading' })

    fetchShopProducts(shopId, 1, 20, {
      categoryId: apiCategoryId,
      minPrice,
      maxPrice,
      isInStock,
      sort,
      search,
    })
      .then(({ products, hasNextPage }) => {
        if (!cancelled) {
          const filtered = rootCategoryId
            ? applyRootFilter(products, rootCategoryId, leafToRoot)
            : products
          dispatch({
            type: 'loaded',
            products: filtered,
            hasNextPage,
            append: false,
          })
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [
    shopId,
    apiCategoryId,
    rootCategoryId,
    minPrice,
    maxPrice,
    isInStock,
    sort,
    search,
    leafToRoot,
  ])

  const loadMore = useCallback(() => {
    pageRef.current += 1
    const page = pageRef.current
    dispatch({ type: 'loading' })

    fetchShopProducts(shopId, page, 20, {
      categoryId: apiCategoryId,
      minPrice,
      maxPrice,
      isInStock,
      sort,
      search,
    })
      .then(({ products, hasNextPage }) => {
        const filtered = rootCategoryId
          ? applyRootFilter(products, rootCategoryId, leafToRoot)
          : products
        dispatch({ type: 'loaded', products: filtered, hasNextPage, append: true })
      })
      .catch(() => {
        dispatch({ type: 'error' })
      })
  }, [
    shopId,
    apiCategoryId,
    rootCategoryId,
    minPrice,
    maxPrice,
    isInStock,
    sort,
    search,
    leafToRoot,
  ])

  return { ...state, loadMore }
}
