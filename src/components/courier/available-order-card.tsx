import { useState } from 'react'
import { Package, Loader2, CheckCircle2, MapPin } from 'lucide-react'
import { shortOrderId, formatDateTimeShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderSummaryDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

interface AvailableOrderCardProps {
  order: OrderSummaryDto
  applied: boolean
  onApply: (orderId: string) => Promise<void>
}

export function AvailableOrderCard({ order, applied, onApply }: AvailableOrderCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

  const handleApply = async () => {
    setLoading(true)
    setError(null)
    try {
      await onApply(order.id ?? '')
    } catch {
      setError('Не удалось подать заявку')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 flex gap-3">
      <img
        src={firstItem?.mainPhotoUrl ?? noImageUrl}
        alt=""
        className="w-14 h-14 rounded-xl object-cover bg-muted shrink-0"
      />

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">#{shortOrderId(order.id)}</span>
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
            Доставка курьером
          </span>
        </div>

        <p className="text-sm font-medium text-foreground truncate">
          {firstItem?.productName ?? 'Заказ'}
          {extraCount > 0 && (
            <span className="text-muted-foreground font-normal"> +{extraCount} ещё</span>
          )}
        </p>

        {order.shopName && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <Package className="w-3 h-3 shrink-0" />
            {order.shopName}
          </p>
        )}

        {order.distanceToShopMeters != null && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            {order.distanceToShopMeters < 1000
              ? `${Math.round(order.distanceToShopMeters)} м до магазина`
              : `${(order.distanceToShopMeters / 1000).toFixed(1)} км до магазина`}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
            {formatDateTimeShort(order.createdAt)}
          </span>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {order.totalAmount?.toFixed(2)} ₽
          </span>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={loading || applied}
          className={cn(
            'mt-1 w-full h-8 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed',
            applied
              ? 'bg-primary/10 text-primary'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60',
          )}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : applied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Заявка подана
            </>
          ) : (
            'Откликнуться'
          )}
        </button>
      </div>
    </div>
  )
}
