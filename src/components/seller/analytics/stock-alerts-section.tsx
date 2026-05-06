import { useState } from 'react'
import { AlertTriangle, CheckCircle, Loader2, Bell } from 'lucide-react'
import { useStockAlerts } from '@/hooks/use-seller-analytics'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { cn } from '@/lib/utils'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function StockAlertsSection() {
  const [onlyUnacknowledged, setOnlyUnacknowledged] = useState(false)
  const { alerts, loading, error, acknowledging, acknowledge } = useStockAlerts(onlyUnacknowledged)

  const unacknowledgedCount = alerts.filter((a) => !a.isAcknowledged).length

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Оповещения о запасах</h2>
          {unacknowledgedCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
              {unacknowledgedCount}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {(
            [
              { v: false, label: 'Все' },
              { v: true, label: 'Новые' },
            ] as { v: boolean; label: string }[]
          ).map(({ v, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setOnlyUnacknowledged(v)}
              className={cn(
                'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                onlyUnacknowledged === v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[58px] bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-6">{error}</p>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <CheckCircle className="w-8 h-8 opacity-40" />
          <p className="text-sm">
            {onlyUnacknowledged ? 'Новых оповещений нет' : 'Оповещений нет'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
                alert.isAcknowledged
                  ? 'border-border bg-background/20 opacity-60'
                  : alert.alertType === 'OutOfStock'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-amber-500/30 bg-amber-500/5',
              )}
            >
              <AlertTriangle
                className={cn(
                  'w-4 h-4 shrink-0',
                  alert.isAcknowledged
                    ? 'text-muted-foreground'
                    : alert.alertType === 'OutOfStock'
                      ? 'text-destructive'
                      : 'text-amber-500',
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{alert.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.alertType === 'OutOfStock' ? 'Нет в наличии' : 'Мало на складе'} ·{' '}
                  <span className="font-medium">{alert.currentStock ?? 0} шт.</span>
                  {alert.isAcknowledged && alert.acknowledgedAt
                    ? ` · Принято ${formatDate(alert.acknowledgedAt)}`
                    : ''}
                </p>
              </div>
              {!alert.isAcknowledged && (
                <ShimmerButton
                  onClick={() => void acknowledge(alert.id!)}
                  disabled={acknowledging === alert.id}
                  className="shrink-0 h-8 px-3 text-xs font-medium"
                >
                  {acknowledging === alert.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Принять
                </ShimmerButton>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
