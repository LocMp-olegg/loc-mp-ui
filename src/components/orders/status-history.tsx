import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronDown } from 'lucide-react'
import { ORDER_STATUS_LABELS, DISPUTE_OUTCOME_LABELS, formatDateTime } from '@/lib/format'
import type { OrderStatusHistoryDto, DisputeDto } from '@/api/orders'

interface StatusHistoryProps {
  history: OrderStatusHistoryDto[]
  dispute?: DisputeDto | null
}

export function StatusHistory({ history, dispute }: StatusHistoryProps) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) return null

  return (
    <div className="rounded-2xl border border-border overflow-hidden"
      style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground transition-colors"
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        История статусов
        <ChevronDown
          className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-0">
              {history.map((h, idx) => {
                const isLast = idx === history.length - 1
                const toLabel = ORDER_STATUS_LABELS[h.toStatus!] ?? h.toStatus ?? '—'

                // For Disputed transition → show dispute outcome if already resolved
                // For Resolved/Closed → show outcome label
                let outcomeNote: string | null = null
                if ((h.toStatus === 'Resolved' || h.toStatus === 'Closed') && dispute?.outcome) {
                  outcomeNote = DISPUTE_OUTCOME_LABELS[dispute.outcome]
                }

                return (
                  <div key={h.id} className="relative flex gap-3">
                    {!isLast && (
                      <div className="absolute left-[6px] top-4 bottom-0 w-px bg-border" />
                    )}
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-primary bg-background shrink-0 mt-1 z-10" />
                    <div className="pb-3 min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground leading-snug">{toLabel}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDateTime(h.changedAt)}
                      </p>
                      {outcomeNote && (
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug">
                          {outcomeNote}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
