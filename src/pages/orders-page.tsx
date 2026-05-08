import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2,
  PackageSearch,
  ChevronRight,
  Package,
  Truck,
  Store,
  Clock,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from 'lucide-react'
import { useMyPurchases } from '@/hooks/use-my-purchases'
import { OrderStatusBadge } from '@/components/seller/orders/order-status-badge'
import { ProfileSelect } from '@/components/ui/profile-select'
import { formatDateTimeShort, shortOrderId } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderSummaryDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'Pending', label: 'Новые' },
  { value: 'Confirmed', label: 'Подтверждённые' },
  { value: 'ReadyForPickup', label: 'Готовы к выдаче' },
  { value: 'InDelivery', label: 'Доставляются' },
  { value: 'Completed', label: 'Завершённые' },
  { value: 'Cancelled', label: 'Отменённые' },
  { value: 'Disputed', label: 'Спорные' },
]

type SortField = 'date' | 'amount'

const SORT_OPTIONS: { value: SortField | ''; label: string }[] = [
  { value: 'date', label: 'По дате' },
  { value: 'amount', label: 'По сумме' },
]

function sortOrders(orders: OrderSummaryDto[], field: SortField | '', desc: boolean) {
  if (!field) return orders
  return [...orders].sort((a, b) => {
    let diff = 0
    if (field === 'date') {
      diff = (new Date(a.createdAt ?? 0).getTime()) - (new Date(b.createdAt ?? 0).getTime())
    } else {
      diff = (a.totalAmount ?? 0) - (b.totalAmount ?? 0)
    }
    return desc ? -diff : diff
  })
}

// ── Order list item ───────────────────────────────────────────────────────────

function PurchaseListItem({ order }: { order: OrderSummaryDto }) {
  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1

  return (
    <Link
      to={`/orders/${order.id}`}
      className="w-full rounded-2xl border border-border bg-card/60 p-3 flex items-center gap-3 hover:bg-card/80 transition-colors text-left"
    >
      <div className="shrink-0">
        <img
          src={firstItem?.mainPhotoUrl ?? noImageUrl}
          alt=""
          className="w-14 h-14 rounded-xl object-cover bg-muted"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">#{shortOrderId(order.id)}</span>
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

        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
          <Clock className="w-3 h-3" />
          {formatDateTimeShort(order.createdAt)}
        </span>
      </div>

      <div className="shrink-0 text-right pl-1 flex items-center gap-1">
        <p className="text-sm font-semibold text-foreground whitespace-nowrap">
          {order.totalAmount?.toFixed(2)} ₽
        </p>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

// ── Orders page ───────────────────────────────────────────────────────────────

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [sortBy, setSortBy] = useState<SortField | ''>('date')
  const [descending, setDescending] = useState(true)

  const { orders, loading, error, hasNextPage, totalCount, loadMore } = useMyPurchases({
    status: statusFilter || undefined,
  })

  const sorted = useMemo(() => sortOrders(orders, sortBy, descending), [orders, sortBy, descending])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Мои заказы</h1>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground ml-1">
            {orders.length}
            {hasNextPage ? '+' : ''} из {totalCount}
          </span>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {opt.label}
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
            descending ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowUpDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content */}
      {loading && orders.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/60 h-[76px] animate-pulse" />
          ))}
        </div>
      ) : error && orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-12 flex flex-col items-center gap-3 text-center">
          <PackageSearch className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {statusFilter ? 'Заказов с таким статусом нет' : 'Заказов пока нет'}
          </p>
          {!statusFilter && (
            <Link to="/" className="text-xs text-primary hover:underline">
              Перейти к покупкам
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((order) => (
            <PurchaseListItem key={order.id} order={order} />
          ))}
        </div>
      )}

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
    </div>
  )
}
