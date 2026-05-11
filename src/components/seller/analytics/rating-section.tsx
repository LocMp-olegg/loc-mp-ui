import { useState } from 'react'
import { Star } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useRatingHistory } from '@/hooks/use-seller-analytics'
import { cn } from '@/lib/utils'

const DAYS_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: '7 дн.', value: 7 },
  { label: '14 дн.', value: 14 },
  { label: '30 дн.', value: 30 },
  { label: '90 дн.', value: 90 },
  { label: 'Всё', value: undefined },
]

const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  fontSize: '12px',
  color: 'var(--foreground)',
}

function formatAxisDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function RatingSection() {
  const [days, setDays] = useState<number | undefined>(30)
  const { history, loading, error } = useRatingHistory(days)

  const chartData = history.map((h) => ({
    date: formatAxisDate(h.recordedAt ?? ''),
    rating: h.averageRating != null ? Math.round(h.averageRating * 10) / 10 : null,
    reviews: h.reviewCount ?? 0,
    newToday: h.newReviewsToday ?? 0,
  }))

  const ratings = chartData.map((d) => d.rating).filter((r): r is number => r !== null)
  const latest = history.length > 0 ? history[history.length - 1] : null
  const totalReviews = latest?.reviewCount ?? 0
  const currentRating = latest?.averageRating

  const yMin = ratings.length ? (d: number) => Math.max(0, d - 0.3) : 0
  const yMax = ratings.length ? (d: number) => Math.min(5, d + 0.3) : 5

  const tickCount = days == null ? 9 : days <= 14 ? days : days <= 30 ? 6 : 9

  const showNewToday =
    (latest?.newReviewsToday ?? 0) > 0 && latest?.recordedAt != null && isToday(latest.recordedAt)

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">История рейтинга продавца</h2>
        </div>
        <div className="flex gap-1">
          {DAYS_OPTIONS.map((opt) => (
            <button
              key={opt.value ?? 'all'}
              type="button"
              onClick={() => setDays(opt.value)}
              className={cn(
                'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                days === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-9 bg-muted rounded-xl animate-pulse" />
            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-[140px] bg-muted/50 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-6">{error}</p>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {currentRating != null ? currentRating.toFixed(1) : '—'}
              </span>
            </div>
            <span className="text-sm text-muted-foreground mb-0.5">{totalReviews} отзывов</span>
            {showNewToday && (
              <span className="text-xs text-primary mb-0.5">
                +{latest!.newReviewsToday} сегодня
              </span>
            )}
          </div>

          {chartData.length >= 2 ? (
            <div className="rounded-xl bg-background/30 border border-border overflow-hidden pt-3 pr-1">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.6}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    tickCount={tickCount}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => v.toFixed(1)}
                    tickCount={4}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v, name) =>
                      [
                        name === 'rating'
                          ? `★ ${typeof v === 'number' ? v.toFixed(1) : '—'}`
                          : String(v ?? ''),
                        name === 'rating' ? 'Рейтинг' : 'Отзывов',
                      ] as [string, string]
                    }
                    labelStyle={{ color: 'var(--muted-foreground)', marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#ratingGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Нет данных за выбранный период
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
