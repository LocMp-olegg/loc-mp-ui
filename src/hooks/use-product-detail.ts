import { useState, useEffect } from 'react'
import { fetchProductDetail } from '@/lib/catalog'
import { fetchProductReviews } from '@/lib/reviews'
import type { ProductDetail, ReviewItem } from '@/types/product-detail'

interface State {
  product: ProductDetail | null
  reviews: ReviewItem[]
  loading: boolean
  error: string | null
}

export function useProductDetail(id: string | undefined): State {
  const [state, setState] = useState<State>({
    product: null,
    reviews: [],
    loading: !!id,
    error: id ? null : 'Товар не найден',
  })

  useEffect(() => {
    if (!id) return

    let cancelled = false

    Promise.all([fetchProductDetail(id), fetchProductReviews(id)])
      .then(([product, reviews]) => {
        if (!cancelled) setState({ product, reviews, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            product: null,
            reviews: [],
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
