import { useState } from 'react'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { useMySales } from '@/hooks/use-my-sales'
import { useMyShops } from '@/hooks/use-my-shops'
import { OrderFilters } from '@/components/seller/orders/order-filters'
import { OrderListItem } from '@/components/seller/orders/order-list-item'
import { OrderDetailModal } from '@/components/seller/orders/order-detail-modal'
import type { OrderStatus, DeliveryType, OrderSortField } from '@/api/orders'

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [shopFilter, setShopFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryType | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortBy, setSortBy] = useState<OrderSortField | ''>('')
  const [descending, setDescending] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { shops } = useMyShops()

  const { orders, loading, error, hasNextPage, totalCount, loadMore, reload } = useMySales({
    shopId: shopFilter || undefined,
    statuses: statusFilter ? [statusFilter] : undefined,
    from: from || undefined,
    to: to || undefined,
    deliveryType: deliveryFilter || undefined,
    sortBy: sortBy || undefined,
    descending,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Заказы</h1>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {orders.length}
            {hasNextPage ? '+' : ''} из {totalCount}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5">
        <OrderFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          shopFilter={shopFilter}
          onShopChange={setShopFilter}
          deliveryFilter={deliveryFilter}
          onDeliveryChange={setDeliveryFilter}
          from={from}
          onFromChange={setFrom}
          to={to}
          onToChange={setTo}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          descending={descending}
          onDescendingChange={setDescending}
          shops={shops}
        />
      </div>

      {/* Content */}
      {loading && orders.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card/60 h-[76px] animate-pulse"
            />
          ))}
        </div>
      ) : error && orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Заказов нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderListItem
              key={order.id}
              order={order}
              onClick={() => setSelectedOrderId(order.id ?? null)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
          >
            Показать ещё
          </button>
        </div>
      )}
      {loading && orders.length > 0 && (
        <div className="flex justify-center mt-6">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      )}

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onActionDone={reload}
      />
    </div>
  )
}
