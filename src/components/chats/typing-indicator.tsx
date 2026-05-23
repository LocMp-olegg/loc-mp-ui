import { motion, AnimatePresence } from 'framer-motion'
import type { TypingUser } from '@/hooks/use-chat-messages'

interface TypingIndicatorProps {
  users: TypingUser[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  const label = users.length === 1 ? `${users[0].userName} печатает` : 'Несколько человек печатают'

  return (
    <AnimatePresence>
      {users.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="flex items-center gap-2 px-4 py-1.5"
        >
          <div className="flex gap-0.5 items-end">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
