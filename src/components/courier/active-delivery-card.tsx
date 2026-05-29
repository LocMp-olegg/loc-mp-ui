import { useState } from 'react'
import { Package, Loader2, CheckCircle2 } from 'lucide-react'
import { shortOrderId, formatDateTimeShort } from '@/lib/format'
import { OrderStatusBadge } from '@/components/seller/orders/order-status-badge'
import { cn } from '@/lib/utils'
import type { OrderSummaryDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

interface ActiveDeliveryCardProps {
  order: OrderSummaryDto
  onPickup: (orderId: string) => Promise<void>
  onDeliver: (orderId: string) => Promise<void>
}

export function ActiveDeliveryCard({ order, onPickup, onDeliver }: ActiveDeliveryCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1
  const isReadyForCourier = order.status === 'ReadyForCourier'
  const isInDelivery = order.status === 'InDelivery'

  const handleAction = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isReadyForCourier) await onPickup(order.id ?? '')
      else if (isInDelivery) await onDeliver(order.id ?? '')
    } catch {
      setError(
        isReadyForCourier ? 'Не удалось подтвердить получение' : 'Не удалось подтвердить доставку',
      )
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 flex gap-3">
      <img
        src={firstItem?.mainPhotoUrl ?? noImageUrl}
        alt=""
        className="w-14 h-14 rounded-xl object-cover bg-muted shrink-0"
      />

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">#{shortOrderId(order.id)}</span>
          <OrderStatusBadge status={order.status} />
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

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
            {formatDateTimeShort(order.createdAt)}
          </span>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {order.totalAmount?.toFixed(2)} ₽
          </span>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {order.status === 'Confirmed' && (
          <p className="mt-1 text-xs text-muted-foreground text-center py-1">
            Ожидает готовности продавца
          </p>
        )}

        {(isReadyForCourier || isInDelivery) && (
          <button
            type="button"
            onClick={() => void handleAction()}
            disabled={loading}
            className={cn(
              'mt-1 w-full h-8 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60',
              isInDelivery
                ? 'bg-green-600/90 hover:bg-green-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground',
            )}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isInDelivery ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Доставил
              </>
            ) : (
              'Забрал у продавца'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
