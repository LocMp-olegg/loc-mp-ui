import { AnimatePresence, motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface ConfirmDeleteProps {
  confirming: boolean
  onConfirmingChange: (v: boolean) => void
  label: string
  onConfirm: () => void
}

export function ConfirmDelete({
  confirming,
  onConfirmingChange,
  label,
  onConfirm,
}: ConfirmDeleteProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => onConfirmingChange(false)}
            className="flex-1 h-10 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <motion.button
            type="button"
            onClick={onConfirm}
            whileTap={{ scale: 0.97 }}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </motion.button>
        </motion.div>
      ) : (
        <motion.button
          key="delete-btn"
          type="button"
          onClick={() => onConfirmingChange(true)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-10 rounded-xl border border-destructive/30 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/8 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          {label}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
