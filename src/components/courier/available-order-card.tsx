import { Package, MapPin, ChevronRight } from 'lucide-react'
import { shortOrderId, formatDateTimeShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderSummaryDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

interface AvailableOrderCardProps {
  order: OrderSummaryDto
  applied: boolean
  onClick: () => void
}

export function AvailableOrderCard({ order, applied, onClick }: AvailableOrderCardProps) {
  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card/60 p-3 flex items-center gap-3 hover:bg-card/80 transition-colors cursor-pointer text-left"
    >
      <img
        src={firstItem?.mainPhotoUrl ?? noImageUrl}
        alt=""
        className="w-14 h-14 rounded-xl object-cover bg-muted shrink-0"
      />

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">#{shortOrderId(order.id)}</span>
          {applied && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
              Заявка подана
            </span>
          )}
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

        <div className="flex items-center gap-2 flex-wrap">
          {order.distanceToShopMeters != null && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-[10px]',
                order.distanceToShopMeters < 1000
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              {order.distanceToShopMeters < 1000
                ? `${Math.round(order.distanceToShopMeters)} м`
                : `${(order.distanceToShopMeters / 1000).toFixed(1)} км`}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
            {formatDateTimeShort(order.createdAt)}
          </span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 pl-1">
        <p className="text-sm font-semibold text-foreground whitespace-nowrap">
          {order.totalAmount?.toFixed(2)} ₽
        </p>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  )
}
