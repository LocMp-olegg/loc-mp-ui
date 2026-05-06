import { Package, Truck, Store } from 'lucide-react'
import { OrderStatusBadge } from './order-status-badge'
import type { OrderSummaryDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

interface OrderListItemProps {
  order: OrderSummaryDto
  onClick: () => void
}

function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortId(id: string | undefined): string {
  if (!id) return '—'
  return id.slice(-8).toUpperCase()
}

export function OrderListItem({ order, onClick }: OrderListItemProps) {
  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card/60 p-3 flex items-center gap-3 hover:bg-card/80 transition-colors cursor-pointer text-left"
    >
      {/* Thumbnail */}
      <div className="shrink-0">
        <img
          src={firstItem?.mainPhotoUrl ?? noImageUrl}
          alt=""
          className="w-14 h-14 rounded-xl object-cover bg-muted"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Row 1: ID + status + delivery */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">#{shortId(order.id)}</span>
          <OrderStatusBadge status={order.status} />
          {order.deliveryType === 'NeighborCourier' ? (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Truck className="w-3 h-3" />
              Курьер
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Store className="w-3 h-3" />
              Самовывоз
            </span>
          )}
        </div>

        {/* Row 2: product name */}
        <p className="text-sm font-medium text-foreground truncate">
          {firstItem?.productName ?? 'Заказ'}
          {extraCount > 0 && (
            <span className="text-muted-foreground font-normal"> +{extraCount} ещё</span>
          )}
        </p>

        {/* Row 3: shop name */}
        {order.shopName && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <Package className="w-3 h-3 shrink-0" />
            {order.shopName}
          </p>
        )}

        {/* Row 4: date */}
        <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
          {formatDate(order.createdAt)}
        </span>
      </div>

      {/* Total */}
      <div className="shrink-0 text-right pl-1">
        <p className="text-sm font-semibold text-foreground whitespace-nowrap">
          {order.totalAmount?.toFixed(2)} ₽
        </p>
      </div>
    </button>
  )
}
