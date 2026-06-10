import type { OrderDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

interface Props {
  order: OrderDto
}

export function OrderItemsSection({ order }: Props) {
  return (
    <section>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Товары
      </p>
      <div className="space-y-2">
        {(order.items ?? []).map((item) => (
          <div key={item.id} className="flex items-center gap-2.5">
            <img
              src={item.mainPhotoUrl ?? noImageUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × {item.unitPrice?.toFixed(2)} ₽
              </p>
            </div>
            <p className="text-sm font-medium text-foreground shrink-0">
              {item.subtotal?.toFixed(2)} ₽
            </p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <span className="text-sm text-muted-foreground">Итого</span>
        <span className="text-base font-semibold text-foreground">
          {order.totalAmount?.toFixed(2)} ₽
        </span>
      </div>
    </section>
  )
}
