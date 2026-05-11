import { MessageSquare, Star } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useSellerRatingAggregate } from '@/hooks/use-seller-analytics'
import { pluralize } from '@/lib/utils'

const STARS = [5, 4, 3, 2, 1] as const

const STAR_KEYS: Record<number, string> = {
  5: 'fiveStar',
  4: 'fourStar',
  3: 'threeStar',
  2: 'twoStar',
  1: 'oneStar',
}

function StarBar({ star, count, max }: { star: number; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  const color =
    star >= 4
      ? 'bg-amber-400'
      : star === 3
        ? 'bg-yellow-500 dark:bg-yellow-400'
        : 'bg-muted-foreground/30'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-4 text-right tabular-nums">{star}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">{count}</span>
    </div>
  )
}

export function SellerReviewsSection() {
  const { user } = useAuth()
  const { data, loading, error } = useSellerRatingAggregate(user?.id)

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Отзывы о продавце</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-9 bg-muted rounded-xl animate-pulse" />
            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {STARS.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-4 h-3 bg-muted rounded animate-pulse" />
                <div className="w-3 h-3 bg-muted rounded animate-pulse" />
                <div className="flex-1 h-2 bg-muted rounded-full animate-pulse" />
                <div className="w-4 h-3 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-6">{error}</p>
      ) : !data || data.reviewCount === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Отзывов пока нет</p>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {(data.averageRating ?? 0).toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground mb-0.5">
              {data.reviewCount} {pluralize(data.reviewCount ?? 0, 'отзыв', 'отзыва', 'отзывов')}
            </span>
          </div>

          <div className="space-y-2">
            {STARS.map((star) => {
              const key = STAR_KEYS[star] as keyof typeof data
              const count = (data[key] as number) ?? 0
              return <StarBar key={star} star={star} count={count} max={data.reviewCount ?? 0} />
            })}
          </div>
        </>
      )}
    </section>
  )
}
