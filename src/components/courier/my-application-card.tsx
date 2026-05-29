import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { shortOrderId, timeAgo } from '@/lib/format'
import { CourierAppStatusBadge } from './courier-app-status-badge'
import type { CourierApplicationDto } from '@/api/orders'

interface MyApplicationCardProps {
  application: CourierApplicationDto
  onWithdraw: (applicationId: string) => Promise<void>
}

export function MyApplicationCard({ application, onWithdraw }: MyApplicationCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWithdraw = async () => {
    setLoading(true)
    setError(null)
    try {
      await onWithdraw(application.id ?? '')
    } catch {
      setError('Не удалось отозвать заявку')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
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

        {application.status === 'Pending' && (
          <button
            type="button"
            onClick={() => void handleWithdraw()}
            disabled={loading}
            className="h-7 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Отозвать'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
