import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { ReviewsService } from '@/api/reviews'
import type { ReviewSummaryDto, PendingReviewSubjectDto } from '@/api/reviews'

const PAGE_SIZE = 20

type State = {
  reviews: ReviewSummaryDto[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  totalCount: number
}

type Action =
  | { type: 'loading' }
  | {
      type: 'success'
      items: ReviewSummaryDto[]
      hasNextPage: boolean
      totalCount: number
      append: boolean
    }
  | { type: 'error'; message: string }
  | { type: 'remove'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'success':
      return {
        reviews: action.append ? [...state.reviews, ...action.items] : action.items,
        loading: false,
        error: null,
        hasNextPage: action.hasNextPage,
        totalCount: action.totalCount,
      }
    case 'error':
      return { ...state, loading: false, error: action.message }
    case 'remove':
      return {
        ...state,
        reviews: state.reviews.filter((r) => r.id !== action.id),
        totalCount: Math.max(0, state.totalCount - 1),
      }
  }
}

const initial: State = {
  reviews: [],
  loading: false,
  error: null,
  hasNextPage: false,
  totalCount: 0,
}

export function useMyReviews() {
  const [state, dispatch] = useReducer(reducer, initial)
  const [reloadKey, setReloadKey] = useState(0)
  const pageRef = useRef(1)
  const fetchingMoreRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'loading' })
    ReviewsService.getApiReviewsReviewsMy({ page: 1, pageSize: PAGE_SIZE })
      .then((data) => {
        if (!cancelled)
          dispatch({
            type: 'success',
            items: data.items ?? [],
            hasNextPage: data.hasNextPage ?? false,
            totalCount: data.totalCount ?? 0,
            append: false,
          })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить отзывы' })
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const loadMore = useCallback(() => {
    if (fetchingMoreRef.current) return
    fetchingMoreRef.current = true
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    dispatch({ type: 'loading' })
    ReviewsService.getApiReviewsReviewsMy({ page: nextPage, pageSize: PAGE_SIZE })
      .then((data) => {
        fetchingMoreRef.current = false
        dispatch({
          type: 'success',
          items: data.items ?? [],
          hasNextPage: data.hasNextPage ?? false,
          totalCount: data.totalCount ?? 0,
          append: true,
        })
      })
      .catch(() => {
        fetchingMoreRef.current = false
        dispatch({ type: 'error', message: 'Не удалось загрузить отзывы' })
      })
  }, [])

  const deleteReview = useCallback(async (id: string): Promise<boolean> => {
    try {
      await ReviewsService.deleteApiReviewsReviews({ id })
      dispatch({ type: 'remove', id })
      return true
    } catch {
      return false
    }
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const [pendingSubjects, setPendingSubjects] = useState<PendingReviewSubjectDto[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      setPendingLoading(true)
      try {
        const first = await ReviewsService.getApiReviewsReviewsAllowed({ page: 1, pageSize: 100 })
        if (cancelled) return
        const items = first.items ?? []
        const total = first.totalCount ?? items.length
        if (total > 100) {
          const pages = Math.ceil(total / 100)
          const rest = await Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
              ReviewsService.getApiReviewsReviewsAllowed({ page: i + 2, pageSize: 100 }),
            ),
          )
          if (!cancelled) {
            setPendingSubjects([...items, ...rest.flatMap((r) => r.items ?? [])])
          }
        } else {
          if (!cancelled) setPendingSubjects(items)
        }
      } catch {
        // ignore — pending section just won't show
      } finally {
        if (!cancelled) setPendingLoading(false)
      }
    }
    void loadAll()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return {
    reviews: state.reviews,
    loading: state.loading,
    error: state.error,
    hasNextPage: state.hasNextPage,
    totalCount: state.totalCount,
    pendingSubjects,
    pendingLoading,
    loadMore,
    deleteReview,
    reload,
  }
}
