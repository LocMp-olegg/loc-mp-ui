import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface ProfileSelectProps {
  options: SelectOption[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function ProfileSelect({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  className,
}: ProfileSelectProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full h-10 px-3 rounded-xl border text-sm flex items-center justify-between gap-2 transition-all cursor-pointer outline-none',
          'bg-background border-border text-foreground',
          'focus:ring-2 focus:ring-primary/25 focus:border-primary/50',
          !current && 'text-muted-foreground',
        )}
      >
        <span>{current?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden py-1"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer',
                  value === opt.value
                    ? 'text-primary font-medium bg-primary/8'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
