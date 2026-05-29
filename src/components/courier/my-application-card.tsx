import { MapPin, ChevronRight } from 'lucide-react'
import { shortOrderId, timeAgo } from '@/lib/format'
import { CourierAppStatusBadge } from './courier-app-status-badge'
import type { CourierApplicationDto } from '@/api/orders'

interface MyApplicationCardProps {
  application: CourierApplicationDto
  onWithdraw: (applicationId: string) => Promise<void>
  onOpen: (orderId: string, applicationId: string) => void
}

export function MyApplicationCard({ application, onOpen }: MyApplicationCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(application.orderId ?? '', application.id ?? '')}
      className="w-full rounded-2xl border border-border bg-card/60 p-3 flex items-center gap-3 hover:bg-card/80 transition-colors cursor-pointer text-left"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">
            #{shortOrderId(application.orderId)}
          </span>
          <CourierAppStatusBadge status={application.status} />
        </div>
        {application.distanceToShopMeters != null && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            {application.distanceToShopMeters < 1000
              ? `${Math.round(application.distanceToShopMeters)} м до магазина`
              : `${(application.distanceToShopMeters / 1000).toFixed(1)} км до магазина`}
          </p>
        )}
        {application.appliedAt && (
          <p className="text-[10px] text-muted-foreground">{timeAgo(application.appliedAt)}</p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  )
}
