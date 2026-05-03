import { useState } from 'react'
import { ShieldAlert, Loader2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProfileSecuritySectionProps {
  onLogoutAll: () => Promise<void>
  onLogout: () => void
}

export function ProfileSecuritySection({ onLogoutAll, onLogout }: ProfileSecuritySectionProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogoutAll = async () => {
    setLoading(true)
    setError(null)
    try {
      await onLogoutAll()
      onLogout()
    } catch {
      setError('Не удалось выйти со всех устройств')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Безопасность</p>
          <p className="text-xs text-muted-foreground">Управление сессиями</p>
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
            <div className="mb-4 p-3 rounded-xl bg-destructive/8 border border-destructive/20 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-relaxed">
                Все активные сессии будут завершены. Вы будете перенаправлены на страницу входа.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {confirming ? (
        <div className="flex items-center gap-3">
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
            onClick={() => void handleLogoutAll()}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Да, выйти отовсюду'}
          </motion.button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full h-10 rounded-xl border border-destructive/30 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors cursor-pointer"
        >
          Выйти со всех устройств
        </button>
      )}
    </div>
  )
}
