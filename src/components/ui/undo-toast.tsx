import { AnimatePresence, motion } from 'framer-motion'
import { Undo2 } from 'lucide-react'

interface Props {
  show: boolean
  message: string
  onUndo: () => void
  /** Changing this key resets the countdown animation (use when message changes mid-show) */
  toastKey?: string | number
  duration?: number
}

export function UndoToast({ show, message, onUndo, toastKey, duration = 5000 }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={toastKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-72 max-w-sm w-[calc(100vw-3rem)] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'color-mix(in srgb, var(--card) 92%, transparent)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <p className="text-sm text-foreground flex-1 truncate">{message}</p>
            <button
              onClick={onUndo}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-75 transition-opacity shrink-0 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Вернуть
            </button>
          </div>
          {/* Countdown bar */}
          <motion.div
            className="h-0.5 bg-primary"
            style={{ originX: 0 }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
