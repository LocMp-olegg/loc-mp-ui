import React, { useState } from 'react'
import { TrendingUp, ShoppingBag, Receipt, CircleDollarSign } from 'lucide-react'
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts'
import { useSalesSummary } from '@/hooks/use-seller-analytics'
import { cn } from '@/lib/utils'
import type { PeriodType } from '@/api/analytics'

const PERIOD_PILLS: { label: string; value: PeriodType | undefined }[] = [
  { label: 'День', value: 'Daily' },
  { label: 'Неделя', value: 'Weekly' },
  { label: 'Месяц', value: 'Monthly' },
  { label: 'Всё', value: undefined },
]

const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  fontSize: '12px',
  color: 'var(--foreground)',
}

function formatMoney(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(v)
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground leading-none tabular-nums">{value}</p>
    </div>
  )
}

export function SalesSection() {
  const [period, setPeriod] = useState<PeriodType | undefined>('Monthly')
  const { data, loading, error } = useSalesSummary(period)

  const completed = data?.completedCount ?? 0
  const cancelled = data?.cancelledCount ?? 0
  const disputed = data?.disputedCount ?? 0
  const total = completed + cancelled + disputed

  const pieData = [
    { name: 'Завершено', value: completed, fill: '#22c55e' },
    { name: 'Отменено', value: cancelled, fill: '#94a3b8' },
    { name: 'Споры', value: disputed, fill: '#f97316' },
  ].filter((d) => d.value > 0)

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Продажи</h2>
        </div>
        <div className="flex gap-1">
          {PERIOD_PILLS.map((p) => (
            <button
              key={p.value ?? 'all'}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                period === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-background/50 h-18 animate-pulse"
              />
            ))}
          </div>
          <div className="h-25 rounded-xl bg-muted/50 animate-pulse" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-6">{error}</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard icon={Receipt} label="Выручка" value={formatMoney(data.totalRevenue)} />
            <KpiCard icon={ShoppingBag} label="Заказов" value={String(data.orderCount ?? 0)} />
            <KpiCard
              icon={CircleDollarSign}
              label="Средний чек"
              value={formatMoney(data.averageOrderValue)}
            />
          </div>

          {total > 0 ? (
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx={45}
                      cy={45}
                      innerRadius={28}
                      outerRadius={44}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="var(--card)"
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Статусы заказов</p>
                <div className="space-y-1.5">
                  {completed > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                      <span className="text-foreground font-medium tabular-nums">{completed}</span>
                      <span className="text-muted-foreground">завершено</span>
                    </div>
                  )}
                  {cancelled > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                      <span className="text-foreground font-medium tabular-nums">{cancelled}</span>
                      <span className="text-muted-foreground">отменено</span>
                    </div>
                  )}
                  {disputed > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                      <span className="text-foreground font-medium tabular-nums">{disputed}</span>
                      <span className="text-muted-foreground">
                        {disputed === 1 ? 'спор' : 'споров'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-3">
              Нет данных за выбранный период
            </p>
          )}
        </>
      ) : null}
    </section>
  )
}
