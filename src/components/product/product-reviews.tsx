import { Loader2 } from 'lucide-react'
import { ReviewCard } from './review-card'
import { ReviewsSummary } from './reviews-summary'
import { ReviewsControls } from './reviews-controls'
import { pluralize } from '@/lib/utils'
import type { RatingAggregateDto, ReviewSortBy } from '@/api/reviews'
import type { ReviewItem } from '@/types/product-detail'

interface Props {
  reviews: ReviewItem[]
  aggregate: RatingAggregateDto | null
  sort: ReviewSortBy
  filterStar: number | null
  hasNextPage: boolean
  loading: boolean
  setSort: (s: ReviewSortBy) => void
  setFilterStar: (r: number | null) => void
  loadMore: () => void
  reset: () => void
}

export function ProductReviews({
  reviews,
  aggregate,
  sort,
  filterStar,
  hasNextPage,
  loading,
  setSort,
  setFilterStar,
  loadMore,
  reset,
}: Props) {
  const reviewCount = aggregate?.reviewCount ?? 0

  if (reviewCount === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 px-6 py-10 text-center">
        <p className="text-muted-foreground text-sm">Отзывов пока нет</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ReviewsSummary aggregate={aggregate} filterStar={filterStar} setFilterStar={setFilterStar} />

      <ReviewsControls
        sort={sort}
        filterStar={filterStar}
        setSort={setSort}
        setFilterStar={setFilterStar}
        reset={reset}
      />

      {filterStar !== null && reviews.length > 0 && (
        <p className="text-xs text-muted-foreground -mt-2">
          {`Показано ${reviews.length} из ${reviewCount} ${pluralize(reviewCount, 'отзыва', 'отзывов', 'отзывов')}`}
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 px-6 py-8 text-center">
          <p className="text-muted-foreground text-sm">Нет отзывов с таким рейтингом</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="self-center flex items-center gap-2 px-5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Показать ещё
        </button>
      )}

      {loading && reviews.length === 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
