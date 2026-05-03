import { useState } from 'react'
import { BadgeCheck, Store, Loader2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SellerStatusCardProps {
  onDeactivate: () => Promise<void>
}

export function SellerStatusCard({ onDeactivate }: SellerStatusCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeactivate = async () => {
    setLoading(true)
    setError(null)
    try {
      await onDeactivate()
      setConfirming(false)
    } catch {
      setError('Не удалось изменить статус. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Store className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Статус продавца</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
              <BadgeCheck className="w-3 h-3" />
              Активен
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Вы можете создавать магазины и продавать товары
          </p>
        </div>
      </div>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-3 rounded-xl bg-destructive/8 border border-destructive/20 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-relaxed">
                Отключение статуса скроет ваши магазины и товары. Вы сможете повторно активировать
                статус в любой момент.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-destructive mt-3">{error}</p>}

      <div className="mt-4 flex items-center justify-end gap-3">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <motion.button
              type="button"
              onClick={() => void handleDeactivate()}
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="h-8 px-4 rounded-xl border border-destructive/40 text-destructive text-xs font-medium flex items-center gap-1.5 hover:bg-destructive/8 transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Да, отключить'
              )}
            </motion.button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            Отключить статус продавца
          </button>
        )}
      </div>
    </div>
  )
}
