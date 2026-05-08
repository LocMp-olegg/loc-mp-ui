import { AnimatePresence, motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { BoundedSuggestion } from '@/lib/geo'

interface FieldSugDropdownProps {
  open: boolean
  items: BoundedSuggestion[]
  onSelect: (s: BoundedSuggestion) => void
  variant?: 'default' | 'dark'
}

export function FieldSugDropdown({
  open,
  items,
  onSelect,
  variant = 'default',
}: FieldSugDropdownProps) {
  const isDark = variant === 'dark'
  return (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden border shadow-xl max-h-48 overflow-y-auto ${
            isDark ? 'border-white/10 backdrop-blur-xl' : 'border-border bg-card'
          }`}
          style={
            isDark
              ? { background: 'color-mix(in srgb, var(--nav-bg) 90%, transparent)' }
              : undefined
          }
        >
          {items.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(s)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                isDark ? 'text-nav-text/80 hover:bg-white/5' : 'text-foreground/80 hover:bg-muted'
              }`}
            >
              <MapPin
                className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-nav-text/40' : 'text-muted-foreground'}`}
              />
              {s.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
