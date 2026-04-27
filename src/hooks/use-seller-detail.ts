import { useEffect, useReducer } from 'react'
import { fetchSellerWithShops } from '@/lib/catalog'
import { fetchSellerRating } from '@/lib/reviews'
import type { SellerDto, ShopDto } from '@/api/catalog'
import type { RatingAggregateDto } from '@/api/reviews'

interface State {
  seller: SellerDto | null
  shops: ShopDto[]
  rating: RatingAggregateDto | null
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'loading' }
  | { type: 'loaded'; seller: SellerDto; shops: ShopDto[]; rating: RatingAggregateDto | null }
  | { type: 'error'; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'loaded':
      return {
        seller: action.seller,
        shops: action.shops,
        rating: action.rating,
        loading: false,
        error: null,
      }
    case 'error':
      return { ...state, loading: false, error: action.message }
  }
}

export function useSellerDetail(sellerId: string) {
  const [state, dispatch] = useReducer(reducer, {
    seller: null,
    shops: [],
    rating: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    fetchSellerWithShops(sellerId)
      .then(async ({ seller, shops }) => {
        const rating = await fetchSellerRating(sellerId).catch(() => null)
        if (!cancelled) dispatch({ type: 'loaded', seller, shops, rating })
      })
      .catch(() => {
        if (!cancelled)
          dispatch({ type: 'error', message: 'Не удалось загрузить профиль продавца' })
      })
    return () => {
      cancelled = true
    }
  }, [sellerId])

  return state
}
