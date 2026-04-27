import { useEffect, useReducer, useState } from 'react'
import { fetchShopDetail, fetchShopProducts, fetchCatalogStructure } from '@/lib/catalog'
import type { ShopDetail } from '@/types/shop'
import type { Product } from '@/types/product'

export interface CategoryGroup {
  id: string
  name: string
  emoji: string
  rootCategoryId: string
  products: Product[]
}

export interface RootCategoryInfo {
  id: string
  name: string
  emoji: string
}

interface State {
  shop: ShopDetail | null
  products: Product[]
  categoryGroups: CategoryGroup[]
  rootCategoriesInShop: RootCategoryInfo[]
  leafToRoot: Map<string, string>
  hasMoreProducts: boolean
  loading: boolean
  loadingMore: boolean
  error: string | null
}

type Action =
  | { type: 'loading' }
  | {
      type: 'loaded'
      shop: ShopDetail
      products: Product[]
      categoryGroups: CategoryGroup[]
      rootCategoriesInShop: RootCategoryInfo[]
      leafToRoot: Map<string, string>
      hasMoreProducts: boolean
    }
  | { type: 'more_loading' }
  | { type: 'more_loaded'; products: Product[]; hasMoreProducts: boolean }
  | { type: 'error'; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'loaded':
      return {
        shop: action.shop,
        products: action.products,
        categoryGroups: action.categoryGroups,
        rootCategoriesInShop: action.rootCategoriesInShop,
        leafToRoot: action.leafToRoot,
        hasMoreProducts: action.hasMoreProducts,
        loading: false,
        loadingMore: false,
        error: null,
      }
    case 'more_loading':
      return { ...state, loadingMore: true }
    case 'more_loaded':
      return {
        ...state,
        products: [...state.products, ...action.products],
        hasMoreProducts: action.hasMoreProducts,
        loadingMore: false,
      }
    case 'error':
      return { ...state, loading: false, loadingMore: false, error: action.message }
  }
}

function groupByCategory(
  products: Product[],
  leafCategories: Array<{ id: string; name: string; emoji: string; rootCategoryId: string }>,
): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>()
  for (const cat of leafCategories) {
    map.set(cat.id, { ...cat, products: [] })
  }
  for (const product of products) {
    const group = map.get(product.categoryId)
    if (group) group.products.push(product)
  }
  return [...map.values()]
    .filter((g) => g.products.length > 0)
    .sort((a, b) => b.products.length - a.products.length)
}

export function useShopDetail(shopId: string) {
  const [state, dispatch] = useReducer(reducer, {
    shop: null,
    products: [],
    categoryGroups: [],
    rootCategoriesInShop: [],
    leafToRoot: new Map(),
    hasMoreProducts: false,
    loading: false,
    loadingMore: false,
    error: null,
  })
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })

    Promise.all([
      fetchShopDetail(shopId),
      fetchShopProducts(shopId, 1, 50),
      fetchCatalogStructure(),
    ])
      .then(([shop, { products, hasNextPage }, catalog]) => {
        if (!cancelled) {
          const leafToRoot = new Map<string, string>()
          for (const cat of catalog.leafCategories) leafToRoot.set(cat.id, cat.rootCategoryId)

          const rootIdsInShop = new Set<string>()
          for (const p of products) {
            const rootId = leafToRoot.get(p.categoryId)
            if (rootId) rootIdsInShop.add(rootId)
          }

          dispatch({
            type: 'loaded',
            shop,
            products,
            categoryGroups: groupByCategory(products, catalog.leafCategories),
            rootCategoriesInShop: catalog.rootCategories.filter((r) => rootIdsInShop.has(r.id)),
            leafToRoot,
            hasMoreProducts: hasNextPage,
          })
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить магазин' })
      })

    return () => {
      cancelled = true
    }
  }, [shopId])

  useEffect(() => {
    if (page === 1) return
    let cancelled = false
    dispatch({ type: 'more_loading' })

    fetchShopProducts(shopId, page)
      .then(({ products, hasNextPage }) => {
        if (!cancelled) dispatch({ type: 'more_loaded', products, hasMoreProducts: hasNextPage })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Ошибка загрузки товаров' })
      })

    return () => {
      cancelled = true
    }
  }, [shopId, page])

  return {
    ...state,
    loadMore: () => setPage((p) => p + 1),
  }
}
