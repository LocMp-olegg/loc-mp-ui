import { cn } from '@/lib/utils'
import type { CourierApplicationStatus } from '@/api/orders'

const CONFIG: Record<CourierApplicationStatus, { label: string; className: string }> = {
  Pending: { label: 'Ожидает', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  Approved: { label: 'Одобрена', className: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  Rejected: { label: 'Отклонена', className: 'bg-muted text-muted-foreground' },
  Withdrawn: { label: 'Отозвана', className: 'bg-muted text-muted-foreground' },
}

export function CourierAppStatusBadge({
  status,
  className,
}: {
  status: CourierApplicationStatus | undefined
  className?: string
}) {
  if (!status) return null
  const cfg = CONFIG[status]
  return (
    <span
      className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md', cfg.className, className)}
    >
      {cfg.label}
    </span>
  )
}
