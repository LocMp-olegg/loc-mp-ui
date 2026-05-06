import React, { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package2, BarChart2, List, Info, ChevronUp, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTopProducts } from '@/hooks/use-seller-analytics'
import { cn } from '@/lib/utils'
import type { PeriodType } from '@/api/analytics'

const PERIOD_PILLS: { label: string; value: PeriodType | undefined }[] = [
  { label: 'День', value: 'Daily' },
  { label: 'Неделя', value: 'Weekly' },
  { label: 'Месяц', value: 'Monthly' },
  { label: 'Всё', value: undefined },
]
const TOP_OPTIONS = [5, 10, 20]

type Metric = 'revenue' | 'sold' | 'views' | 'favorites'
type SortDir = 'asc' | 'desc'
type ViewMode = 'chart' | 'table'

const METRICS: { v: Metric; label: string; unit: string; hint: string }[] = [
  {
    v: 'revenue',
    label: 'Выручка, ₽',
    unit: '₽',
    hint: 'Суммарная выручка от продаж товара за период (только из завершённых заказов)',
  },
  {
    v: 'sold',
    label: 'Продано, шт.',
    unit: 'шт.',
    hint: 'Количество проданных единиц товара за период (только из завершённых заказов)',
  },
  {
    v: 'views',
    label: 'Просмотры',
    unit: '',
    hint: 'Число просмотров страницы товара за период',
  },
  {
    v: 'favorites',
    label: 'Избранное',
    unit: '',
    hint: 'Сколько раз товар добавили в избранное за период',
  },
]

const TOOLTIP_STYLE: React.CSSProperties = {
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

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center">
      <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl border border-border bg-card px-3 py-2 text-xs leading-snug text-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 text-left font-normal normal-case">
        {text}
      </span>
    </span>
  )
}

type ChartEntry = {
  name: string
  productId: string
  revenue: number
  sold: number
  views: number
  favorites: number
}

export function TopProductsSection() {
  const [period, setPeriod] = useState<PeriodType | undefined>('Weekly')
  const [top, setTop] = useState(10)
  const [metric, setMetric] = useState<Metric>('revenue')
  const [view, setView] = useState<ViewMode>('chart')
  const [sortKey, setSortKey] = useState<Metric>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const navigate = useNavigate()
  const { products, loading, error } = useTopProducts(period, top)

  const chartData: ChartEntry[] = useMemo(
    () =>
      products
        .map((p) => ({
          name:
            (p.productName?.length ?? 0) > 22
              ? (p.productName?.slice(0, 21) ?? '') + '…'
              : (p.productName ?? '—'),
          productId: p.productId ?? '',
          revenue: p.totalRevenue ?? 0,
          sold: p.totalSold ?? 0,
          views: p.viewCount ?? 0,
          favorites: p.favoriteCount ?? 0,
        }))
        .sort((a, b) => b[metric] - a[metric]),
    [products, metric],
  )

  const chartHeight = Math.max(180, chartData.length * 40 + 30)

  const nameToId = useMemo(
    () => Object.fromEntries(chartData.map((d) => [d.name, d.productId])),
    [chartData],
  )

  const renderYAxisTick = useCallback(
    (props: object) => {
      const { x, y, payload } = props as { x: number; y: number; payload: { value: string } }
      const name = payload.value
      const productId = nameToId[name]
      return (
        <text
          x={x}
          y={y}
          dy={4}
          textAnchor="end"
          fontSize={11}
          fill={productId ? 'var(--primary)' : 'var(--muted-foreground)'}
          style={{ cursor: productId ? 'pointer' : 'default' }}
          onClick={() => {
            if (productId) navigate(`/product/${productId}`)
          }}
        >
          {name}
        </text>
      )
    },
    [nameToId, navigate],
  )

  const tableData = useMemo(
    () =>
      [...products].sort((a, b) => {
        const va =
          sortKey === 'revenue'
            ? (a.totalRevenue ?? 0)
            : sortKey === 'sold'
              ? (a.totalSold ?? 0)
              : sortKey === 'views'
                ? (a.viewCount ?? 0)
                : (a.favoriteCount ?? 0)
        const vb =
          sortKey === 'revenue'
            ? (b.totalRevenue ?? 0)
            : sortKey === 'sold'
              ? (b.totalSold ?? 0)
              : sortKey === 'views'
                ? (b.viewCount ?? 0)
                : (b.favoriteCount ?? 0)
        return sortDir === 'desc' ? vb - va : va - vb
      }),
    [products, sortKey, sortDir],
  )

  const handleSort = (key: Metric) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const activeMetricInfo = METRICS.find((m) => m.v === metric)

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-center gap-2">
        <Package2 className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Топ товаров</h2>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setView('chart')}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
              view === 'chart'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            title="График"
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer',
              view === 'table'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            title="Таблица"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
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
        <div className="flex gap-1">
          {TOP_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTop(n)}
              className={cn(
                'h-7 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                top === n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              Топ {n}
            </button>
          ))}
        </div>
        {view === 'chart' && (
          <div className="flex gap-1 ml-auto flex-wrap">
            {METRICS.map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => setMetric(m.v)}
                className={cn(
                  'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                  metric === m.v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-36 h-3.5 bg-muted rounded animate-pulse shrink-0" />
              <div
                className="h-7 bg-muted rounded-md animate-pulse"
                style={{ width: `${70 - i * 12}%` }}
              />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-6">{error}</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Нет данных за выбранный период
        </p>
      ) : view === 'chart' ? (
        <>
          {activeMetricInfo && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <InfoTooltip text={activeMetricInfo.hint} />
              <span>{activeMetricInfo.label}</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              barCategoryGap={6}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.6}
              />
              <XAxis type="number" hide domain={[0, (max: number) => max * 1.15]} />
              <YAxis
                type="category"
                dataKey="name"
                width={148}
                axisLine={false}
                tickLine={false}
                tick={renderYAxisTick}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as ChartEntry
                  return (
                    <div style={TOOLTIP_STYLE} className="p-2.5 min-w-42.5">
                      <p className="text-xs font-semibold text-foreground mb-2 truncate max-w-47.5">
                        {d.name}
                      </p>
                      {METRICS.map((m) => (
                        <div
                          key={m.v}
                          className="flex items-center justify-between gap-4 text-xs py-0.5"
                        >
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {m.v === 'revenue'
                              ? formatMoney(d.revenue)
                              : m.v === 'sold'
                                ? `${d.sold} шт.`
                                : m.v === 'views'
                                  ? String(d.views)
                                  : String(d.favorites)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              <Bar
                dataKey={metric}
                fill="var(--primary)"
                fillOpacity={0.8}
                radius={[0, 4, 4, 0]}
                barSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background/30">
                <th className="px-3 py-2.5 text-left text-muted-foreground font-medium w-8">#</th>
                <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">Товар</th>
                {METRICS.map((m) => (
                  <th
                    key={m.v}
                    className="px-3 py-2.5 text-right text-muted-foreground font-medium cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
                    onClick={() => handleSort(m.v)}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      {m.label}
                      {sortKey === m.v ? (
                        sortDir === 'desc' ? (
                          <ChevronDown className="w-3 h-3 text-primary" />
                        ) : (
                          <ChevronUp className="w-3 h-3 text-primary" />
                        )
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((p, i) => (
                <tr
                  key={p.productId}
                  className="border-b border-border/50 last:border-0 hover:bg-background/20 transition-colors"
                >
                  <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5 max-w-45 truncate">
                    <Link
                      to={`/product/${p.productId}`}
                      className="text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {p.productName ?? '—'}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground font-medium">
                    {formatMoney(p.totalRevenue)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                    {p.totalSold ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                    {p.viewCount ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                    {p.favoriteCount ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
