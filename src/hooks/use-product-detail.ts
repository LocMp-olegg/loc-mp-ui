import { useState, useEffect } from 'react'
import { fetchProductDetail } from '@/lib/catalog'
import { fetchProductRating, fetchProductReviews } from '@/lib/reviews'
import type { ProductDetail, RatingAggregate, ReviewItem } from '@/types/product-detail'

interface State {
  product: ProductDetail | null
  reviews: ReviewItem[]
  rating: RatingAggregate | null
  loading: boolean
  error: string | null
}

export function useProductDetail(id: string | undefined): State {
  const [state, setState] = useState<State>({
    product: null,
    reviews: [],
    rating: null,
    loading: !!id,
    error: id ? null : 'Товар не найден',
  })

  useEffect(() => {
    if (!id) return

    let cancelled = false

    Promise.all([fetchProductDetail(id), fetchProductReviews(id), fetchProductRating(id)])
      .then(([product, reviews, rating]) => {
        if (!cancelled) setState({ product, reviews, rating, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            product: null,
            reviews: [],
            rating: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Ошибка загрузки',
          })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return state
}
