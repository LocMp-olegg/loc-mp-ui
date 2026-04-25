import { ArrowDown, ArrowUp, Clock, RotateCcw, Star } from 'lucide-react'
import { ReviewCard } from './review-card'
import { StarRating } from '@/components/ui/star-rating'
import { pluralize, cn } from '@/lib/utils'
import type { RatingAggregateDto, ReviewSortBy } from '@/api/reviews'
import type { ReviewItem } from '@/types/product-detail'

const SORT_OPTIONS: { key: ReviewSortBy; label: string; icon: React.ReactNode }[] = [
  { key: 'DateDesc',   label: 'Сначала новые',           icon: <><Clock className="w-3 h-3" /><ArrowDown className="w-3 h-3" /></> },
  { key: 'DateAsc',    label: 'Сначала старые',           icon: <><Clock className="w-3 h-3" /><ArrowUp className="w-3 h-3" /></> },
  { key: 'RatingDesc', label: 'Сначала высокий рейтинг', icon: <><Star className="w-3 h-3" /><ArrowDown className="w-3 h-3" /></> },
  { key: 'RatingAsc',  label: 'Сначала низкий рейтинг',  icon: <><Star className="w-3 h-3" /><ArrowUp className="w-3 h-3" /></> },
]

interface Props {
  reviews: ReviewItem[]
  aggregate: RatingAggregateDto | null
  sort: ReviewSortBy
  filterStar: number | null
  setSort: (s: ReviewSortBy) => void
  setFilterStar: (r: number | null) => void
  reset: () => void
}

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
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-muted-foreground">{count}</span>
    </button>
  )
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-foreground text-background text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
        {text}
      </div>
    </div>
  )
}


function StarFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer',
          value === null
            ? 'border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400'
            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
        )}
      >
        Все
      </button>
      {[5, 4, 3, 2, 1].map((s) => (
        <button
          key={s}
          onClick={() => onChange(value === s ? null : s)}
          className={cn(
            'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer',
            value === s
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          )}
        >
          {s}
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        </button>
      ))}
    </div>
  )
}

export function ProductReviews({ reviews, aggregate, sort, filterStar, setSort, setFilterStar, reset }: Props) {
  const rating = aggregate?.averageRating ?? 0
  const reviewCount = aggregate?.reviewCount ?? 0

  const counts = [
    { stars: 5, count: aggregate?.fiveStar ?? 0 },
    { stars: 4, count: aggregate?.fourStar ?? 0 },
    { stars: 3, count: aggregate?.threeStar ?? 0 },
    { stars: 2, count: aggregate?.twoStar ?? 0 },
    { stars: 1, count: aggregate?.oneStar ?? 0 },
  ]

  const isFiltered = filterStar !== null || sort !== 'DateDesc'

  if (reviewCount === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 px-6 py-10 text-center">
        <p className="text-muted-foreground text-sm">Отзывов пока нет</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
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

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarFilter value={filterStar} onChange={setFilterStar} />
          {isFiltered && (
            <Tooltip text="Сбросить фильтры и сортировку">
              <button
                onClick={reset}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Сбросить
              </button>
            </Tooltip>
          )}
        </div>

        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <Tooltip key={opt.key} text={opt.label}>
              <button
                onClick={() => setSort(opt.key)}
                className={cn(
                  'flex items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors cursor-pointer',
                  sort === opt.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {opt.icon}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Hint */}
      {filterStar !== null && reviews.length > 0 && (
        <p className="text-xs text-muted-foreground -mt-2">
          {`Показано ${reviews.length} из ${reviewCount} ${pluralize(reviewCount, 'отзыва', 'отзывов', 'отзывов')}`}
        </p>
      )}

      {/* Review list */}
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
    </div>
  )
}
