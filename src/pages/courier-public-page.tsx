import { useReducer, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Truck, Phone, Star, ArrowLeft, Loader2 } from 'lucide-react'
import { useCourierReviews } from '@/hooks/use-courier-reviews'
import { fetchCourierRating } from '@/lib/reviews'
import { ProductReviews } from '@/components/product/product-reviews'
import { displayPhone } from '@/lib/format'
import { pluralize } from '@/lib/utils'
import type { RatingAggregateDto } from '@/api/reviews'

type RatingState = { aggregate: RatingAggregateDto | null; loading: boolean }
type RatingAction =
  | { type: 'fetching' }
  | { type: 'fetched'; data: RatingAggregateDto }
  | { type: 'error' }

function ratingReducer(_state: RatingState, action: RatingAction): RatingState {
  switch (action.type) {
    case 'fetching':
      return { aggregate: null, loading: true }
    case 'fetched':
      return { aggregate: action.data, loading: false }
    case 'error':
      return { aggregate: null, loading: false }
  }
}

interface CourierLocationState {
  name?: string | null
  phone?: string | null
}

function CourierAvatar() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
      <Truck className="w-8 h-8 text-primary" />
    </div>
  )
}

export function CourierPublicPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state as CourierLocationState | null) ?? {}

  const name = state.name?.trim() || 'Курьер'
  const phone = state.phone ?? null

  const [{ aggregate, loading: ratingLoading }, dispatch] = useReducer(ratingReducer, {
    aggregate: null,
    loading: true,
  })

  const {
    reviews,
    hasNextPage,
    loading: reviewsLoading,
    sort,
    filterStar,
    setSort,
    setFilterStar,
    loadMore,
    reset,
  } = useCourierReviews(id)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    dispatch({ type: 'fetching' })
    fetchCourierRating(id)
      .then((data) => {
        if (!cancelled) dispatch({ type: 'fetched', data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const reviewCount = aggregate?.reviewCount ?? 0
  const avgRating = aggregate?.averageRating ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <div
        className="rounded-2xl border border-border p-5 mb-6 flex items-center gap-4"
        style={{ background: 'color-mix(in srgb, var(--card) 60%, transparent)' }}
      >
        <CourierAvatar />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{name}</h1>

          {phone && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              {displayPhone(phone)}
            </p>
          )}

          {ratingLoading ? (
            <div className="flex items-center gap-1.5 mt-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : reviewCount > 0 ? (
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                {reviewCount} {pluralize(reviewCount, 'отзыв', 'отзыва', 'отзывов')}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <ProductReviews
        reviews={reviews}
        aggregate={aggregate}
        sort={sort}
        filterStar={filterStar}
        hasNextPage={hasNextPage}
        loading={reviewsLoading}
        setSort={setSort}
        setFilterStar={setFilterStar}
        loadMore={loadMore}
        reset={reset}
      />
    </div>
  )
}
