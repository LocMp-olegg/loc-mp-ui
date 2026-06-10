import { useState } from 'react'
import { Bike, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BecomeCourierCardProps {
  onBecomeCourier: () => Promise<void>
}

export function BecomeCourierCard({ onBecomeCourier }: BecomeCourierCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onBecomeCourier()
    } catch {
      setError('Не удалось подключить статус курьера. Попробуйте позже.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Bike className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Стать курьером</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Доставляйте заказы соседям в своём районе
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
              {[
                'Принимайте заказы в своём районе в удобное время',
                'Настройте зону доставки и рабочий радиус',
                'Статус можно приостановить или отозвать в любой момент',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">{item}</p>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-destructive mb-3">{error}</p>}

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
                onClick={() => void handleConfirm()}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Подтвердить
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Помогайте соседям получать заказы быстро. Гибкий график, небольшой радиус доставки.
            </p>
            <motion.button
              type="button"
              onClick={() => setConfirming(true)}
              whileTap={{ scale: 0.97 }}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Стать курьером
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
