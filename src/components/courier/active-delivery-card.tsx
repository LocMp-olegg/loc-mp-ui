import { useState } from 'react'
import { Package, ChevronRight } from 'lucide-react'
import { shortOrderId, formatDateTimeShort } from '@/lib/format'
import { OrderStatusBadge } from '@/components/seller/orders/order-status-badge'
import { CourierOrderModal } from './courier-order-modal'
import type { OrderSummaryDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

interface ActiveDeliveryCardProps {
  order: OrderSummaryDto
  onPickup: (orderId: string) => Promise<void>
  onDeliver: (orderId: string) => Promise<void>
  courierLat?: number | null
  courierLng?: number | null
}

export function ActiveDeliveryCard({
  order,
  onPickup,
  onDeliver,
  courierLat,
  courierLng,
}: ActiveDeliveryCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)

  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

  return (
    <>
      <CourierOrderModal
        orderId={detailOpen ? (order.id ?? null) : null}
        onClose={() => setDetailOpen(false)}
        courierLat={courierLat}
        courierLng={courierLng}
        onPickup={onPickup}
        onDeliver={onDeliver}
      />

      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3 hover:bg-primary/8 transition-colors cursor-pointer text-left"
      >
        <img
          src={firstItem?.mainPhotoUrl ?? noImageUrl}
          alt=""
          className="w-14 h-14 rounded-xl object-cover bg-muted shrink-0"
        />

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">
              #{shortOrderId(order.id)}
            </span>
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

          <span className="inline-block text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
            {formatDateTimeShort(order.createdAt)}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-1 pl-1">
          <p className="text-sm font-semibold text-foreground whitespace-nowrap">
            {order.totalAmount?.toFixed(2)} ₽
          </p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    </>
  )
}
