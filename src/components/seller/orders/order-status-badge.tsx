import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/api/orders'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  Pending: { label: 'Новый', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  Confirmed: {
    label: 'Подтверждён',
    className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  },
  ReadyForPickup: {
    label: 'Готов к выдаче',
    className: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  },
  InDelivery: {
    label: 'Доставляется',
    className: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  },
  Completed: {
    label: 'Завершён',
    className: 'bg-green-500/15 text-green-700 dark:text-green-400',
  },
  Cancelled: { label: 'Отменён', className: 'bg-muted text-muted-foreground' },
  Disputed: {
    label: 'Спор',
    className: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  },
}

interface OrderStatusBadgeProps {
  status: OrderStatus | undefined
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  if (!status) return null
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md', cfg.className, className)}
    >
      {cfg.label}
    </span>
  )
}
