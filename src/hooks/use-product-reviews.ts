import { useState, useEffect } from 'react'
import type { ReviewSortBy } from '@/api/reviews'
import { fetchProductReviews } from '@/lib/reviews'
import type { ReviewItem } from '@/types/product-detail'

export type ReviewSortKey = ReviewSortBy

interface State {
  reviews: ReviewItem[]
  sort: ReviewSortKey
  filterStar: number | null
  setSort: (s: ReviewSortKey) => void
  setFilterStar: (r: number | null) => void
  reset: () => void
}

const DEFAULT_SORT: ReviewSortKey = 'DateDesc'

export function useProductReviews(productId: string | undefined): State {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [sort, setSort] = useState<ReviewSortKey>(DEFAULT_SORT)
  const [filterStar, setFilterStar] = useState<number | null>(null)

  useEffect(() => {
    if (!productId) return
    let cancelled = false

    fetchProductReviews(productId, sort, filterStar ?? undefined)
      .then((result) => { if (!cancelled) setReviews(result) })
      .catch(() => { if (!cancelled) setReviews([]) })

    return () => { cancelled = true }
  }, [productId, sort, filterStar])

  const reset = () => { setSort(DEFAULT_SORT); setFilterStar(null) }

  return { reviews, sort, filterStar, setSort, setFilterStar, reset }
}
