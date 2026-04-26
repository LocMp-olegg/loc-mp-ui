import { useState, useEffect } from 'react'
import { fetchProductDetail } from '@/lib/catalog'
import { fetchProductRating } from '@/lib/reviews'
import type { RatingAggregateDto } from '@/api/reviews'
import type { ProductDetail } from '@/types/product-detail'

interface State {
  product: ProductDetail | null
  rating: RatingAggregateDto | null
  loading: boolean
  error: string | null
}

export function useProductDetail(id: string | undefined): State {
  const [state, setState] = useState<State>({
    product: null,
    rating: null,
    loading: !!id,
    error: id ? null : 'Товар не найден',
  })

  useEffect(() => {
    if (!id) return

    let cancelled = false

    Promise.all([fetchProductDetail(id), fetchProductRating(id)])
      .then(([product, rating]) => {
        if (!cancelled) setState({ product, rating, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            product: null,
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
