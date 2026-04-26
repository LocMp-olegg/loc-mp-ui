import { Star } from 'lucide-react'
import { StarRating } from '@/components/ui/star-rating'
import { pluralize, cn } from '@/lib/utils'
import type { RatingAggregateDto } from '@/api/reviews'

interface RatingBarProps {
  stars: number
  count: number
  total: number
  active: boolean
  onClick: () => void
}

function RatingBar({ stars, count, total, active, onClick }: RatingBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 text-xs w-full rounded-lg px-1 py-0.5 transition-colors cursor-pointer',
        active ? 'bg-amber-400/10' : 'hover:bg-muted',
      )}
    >
      <span className="w-3 text-right text-muted-foreground">{stars}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-muted-foreground">{count}</span>
    </button>
  )
}

interface Props {
  aggregate: RatingAggregateDto | null
  filterStar: number | null
  setFilterStar: (r: number | null) => void
}

export function ReviewsSummary({ aggregate, filterStar, setFilterStar }: Props) {
  const rating = aggregate?.averageRating ?? 0
  const reviewCount = aggregate?.reviewCount ?? 0

  const counts = [
    { stars: 5, count: aggregate?.fiveStar ?? 0 },
    { stars: 4, count: aggregate?.fourStar ?? 0 },
    { stars: 3, count: aggregate?.threeStar ?? 0 },
    { stars: 2, count: aggregate?.twoStar ?? 0 },
    { stars: 1, count: aggregate?.oneStar ?? 0 },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 flex flex-col sm:flex-row gap-5">
      <div className="flex flex-col items-center justify-center gap-1 sm:min-w-28">
        <span className="text-5xl font-bold text-foreground">{rating}</span>
        <StarRating rating={rating} size={18} />
        <span className="text-xs text-muted-foreground">
          {reviewCount} {pluralize(reviewCount, 'отзыв', 'отзыва', 'отзывов')}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-1">
        {counts.map(({ stars, count }) => (
          <RatingBar
            key={stars}
            stars={stars}
            count={count}
            total={reviewCount}
            active={filterStar === stars}
            onClick={() => setFilterStar(filterStar === stars ? null : stars)}
          />
        ))}
      </div>
    </div>
  )
}
