import { useEffect, useReducer, useState } from 'react'
import { fetchShopDetail, fetchShopProducts } from '@/lib/catalog'
import { fetchSellerRating } from '@/lib/reviews'
import type { ShopDetail } from '@/types/shop'
import type { Product } from '@/types/product'
import type { RatingAggregateDto } from '@/api/reviews'

interface State {
  shop: ShopDetail | null
  products: Product[]
  hasMoreProducts: boolean
  rating: RatingAggregateDto | null
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
      hasMoreProducts: boolean
      rating: RatingAggregateDto | null
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
        hasMoreProducts: action.hasMoreProducts,
        rating: action.rating,
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

export function useShopDetail(shopId: string) {
  const [state, dispatch] = useReducer(reducer, {
    shop: null,
    products: [],
    hasMoreProducts: false,
    rating: null,
    loading: false,
    loadingMore: false,
    error: null,
  })
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })

    Promise.all([fetchShopDetail(shopId), fetchShopProducts(shopId, 1)])
      .then(async ([shop, { products, hasNextPage }]) => {
        const rating = await fetchSellerRating(shop.sellerId).catch(() => null)
        if (!cancelled)
          dispatch({ type: 'loaded', shop, products, hasMoreProducts: hasNextPage, rating })
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
