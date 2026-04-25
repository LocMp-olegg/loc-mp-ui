import { Star } from 'lucide-react'
import { ReviewCard } from './review-card'
import { pluralize } from '@/lib/utils'
import type { ReviewItem } from '@/types/product-detail'

interface Props {
  reviews: ReviewItem[]
  rating: number
  reviewCount: number
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-muted-foreground">{label}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-muted-foreground">{count}</span>
    </div>
  )
}

export function ProductReviews({ reviews, rating, reviewCount }: Props) {
  if (reviewCount === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 px-6 py-10 text-center">
        <p className="text-muted-foreground text-sm">Отзывов пока нет</p>
      </div>
    )
  }

  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }))

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 flex flex-col sm:flex-row gap-5">
        <div className="flex flex-col items-center justify-center gap-1 sm:min-w-28">
          <span className="text-5xl font-bold text-foreground">{rating.toFixed(1)}</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {reviewCount} {pluralize(reviewCount, 'отзыв', 'отзыва', 'отзывов')}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-2">
          {counts.map(({ stars, count }) => (
            <RatingBar key={stars} label={String(stars)} count={count} total={reviewCount} />
          ))}
        </div>
      </div>

      {/* Review list */}
      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
