import { useState, useMemo } from 'react'
import {
  Loader2,
  Package,
  PackageSearch,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react'
import { useCourierHistory } from '@/hooks/use-courier-history'
import { OrderStatusBadge } from '@/components/seller/orders/order-status-badge'
import { CourierOrderModal } from '@/components/courier/courier-order-modal'
import { ProfileSelect } from '@/components/ui/profile-select'
import { shortOrderId, formatDateTimeShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderSummaryDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

type SortField = 'date' | 'amount'

const STATUS_PILLS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'Все', value: '' },
  { label: 'Завершённые', value: 'Completed' },
  { label: 'Отменённые', value: 'Cancelled' },
]

const SORT_OPTIONS: { value: SortField | ''; label: string }[] = [
  { value: 'date', label: 'По дате' },
  { value: 'amount', label: 'По сумме' },
]

function sortOrders(orders: OrderSummaryDto[], field: SortField | '', desc: boolean) {
  if (!field) return orders
  return [...orders].sort((a, b) => {
    const diff =
      field === 'date'
        ? new Date(a.completedAt ?? a.createdAt ?? 0).getTime() -
          new Date(b.completedAt ?? b.createdAt ?? 0).getTime()
        : (a.totalAmount ?? 0) - (b.totalAmount ?? 0)
    return desc ? -diff : diff
  })
}

function HistoryItem({ order, onOpen }: { order: OrderSummaryDto; onOpen: (id: string) => void }) {
  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

  return (
    <button
      type="button"
      onClick={() => onOpen(order.id ?? '')}
      className="w-full rounded-2xl border border-border bg-card/60 p-3 flex items-center gap-3 hover:bg-card/80 transition-colors text-left cursor-pointer"
    >
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

        <span className="inline-block text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
          {formatDateTimeShort(order.completedAt ?? order.createdAt)}
        </span>
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

export function CourierHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [sortBy, setSortBy] = useState<SortField | ''>('date')
  const [descending, setDescending] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { orders, loading, error, hasNextPage, totalCount, loadMore } = useCourierHistory({
    status: statusFilter || undefined,
  })

  const sorted = useMemo(() => sortOrders(orders, sortBy, descending), [orders, sortBy, descending])

  return (
    <>
      <CourierOrderModal orderId={detailId} onClose={() => setDetailId(null)} />
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">История доставок</h1>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {orders.length}
              {hasNextPage ? '+' : ''} из {totalCount}
            </span>
          )}
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setStatusFilter(pill.value)}
              className={cn(
                'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                statusFilter === pill.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-5">
          <ProfileSelect
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(v) => setSortBy(v as SortField | '')}
            className="w-36"
          />
          <button
            type="button"
            title={descending ? 'По убыванию' : 'По возрастанию'}
            onClick={() => setDescending((d) => !d)}
            className={cn(
              'h-10 w-10 rounded-xl border border-border flex items-center justify-center transition-colors cursor-pointer shrink-0',
              sortBy ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {sortBy ? (
              descending ? (
                <ArrowDown className="w-4 h-4" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )
            ) : (
              <ArrowUpDown className="w-4 h-4" />
            )}
          </button>
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
        ) : error ? (
          <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/60 p-12 flex flex-col items-center gap-3 text-center">
            <PackageSearch className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {statusFilter ? 'Нет заказов с таким статусом' : 'История доставок пуста'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((order) => (
              <HistoryItem key={order.id} order={order} onOpen={setDetailId} />
            ))}
          </div>
        )}

        {hasNextPage && !loading && (
          <button
            type="button"
            onClick={loadMore}
            className="w-full mt-4 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            Загрузить ещё
          </button>
        )}

        {loading && orders.length > 0 && (
          <div className="flex justify-center mt-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </>
  )
}
