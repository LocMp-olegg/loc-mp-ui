import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Blocker } from 'react-router-dom'

interface UnsavedChangesModalProps {
  blocker: Blocker
}

export function UnsavedChangesModal({ blocker }: UnsavedChangesModalProps) {
  const isBlocked = blocker.state === 'blocked'

  return createPortal(
    <AnimatePresence>
      {isBlocked && (
        <motion.div
          key="unsaved-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-300 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6"
          >
            <h2 className="text-base font-semibold text-foreground mb-2">
              Несохранённые изменения
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Вы уходите со страницы, не сохранив изменения. Данные будут потеряны.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => blocker.reset?.()}
                className="flex-1 h-10 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Остаться
              </button>
              <button
                type="button"
                onClick={() => blocker.proceed?.()}
                className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors cursor-pointer"
              >
                Покинуть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
