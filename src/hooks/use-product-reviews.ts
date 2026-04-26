import { useReducer, useState, useEffect } from 'react'
import type { ReviewSortBy } from '@/api/reviews'
import { fetchProductReviews } from '@/lib/reviews'
import type { ReviewItem } from '@/types/product-detail'

export type ReviewSortKey = ReviewSortBy

const DEFAULT_SORT: ReviewSortKey = 'DateDesc'

interface ReviewsState {
  reviews: ReviewItem[]
  hasNextPage: boolean
  loading: boolean
}

type ReviewsAction =
  | { type: 'fetching' }
  | { type: 'fetched'; items: ReviewItem[]; hasNextPage: boolean; append: boolean }
  | { type: 'error' }

function reducer(state: ReviewsState, action: ReviewsAction): ReviewsState {
  switch (action.type) {
    case 'fetching':
      return { ...state, loading: true }
    case 'fetched':
      return {
        reviews: action.append ? [...state.reviews, ...action.items] : action.items,
        hasNextPage: action.hasNextPage,
        loading: false,
      }
    case 'error':
      return { reviews: [], hasNextPage: false, loading: false }
  }
}

interface State {
  reviews: ReviewItem[]
  hasNextPage: boolean
  loading: boolean
  sort: ReviewSortKey
  filterStar: number | null
  setSort: (s: ReviewSortKey) => void
  setFilterStar: (r: number | null) => void
  loadMore: () => void
  reset: () => void
}

export function useProductReviews(productId: string | undefined): State {
  const [{ reviews, hasNextPage, loading }, dispatch] = useReducer(reducer, {
    reviews: [],
    hasNextPage: false,
    loading: false,
  })
  const [sort, _setSort] = useState<ReviewSortKey>(DEFAULT_SORT)
  const [filterStar, _setFilterStar] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    const append = page > 1

    dispatch({ type: 'fetching' })

    fetchProductReviews(productId, sort, filterStar ?? undefined, page)
      .then(({ items, hasNextPage }) => {
        if (!cancelled) dispatch({ type: 'fetched', items, hasNextPage, append })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [productId, sort, filterStar, page])

  const setSort = (s: ReviewSortKey) => { _setSort(s); setPage(1) }
  const setFilterStar = (r: number | null) => { _setFilterStar(r); setPage(1) }
  const loadMore = () => setPage((p) => p + 1)
  const reset = () => { _setSort(DEFAULT_SORT); _setFilterStar(null); setPage(1) }

  return { reviews, hasNextPage, loading, sort, filterStar, setSort, setFilterStar, loadMore, reset }
}
