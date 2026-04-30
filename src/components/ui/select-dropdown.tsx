import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlowWrapper } from '@/components/ui/glow-input'

export interface SelectOption {
  value: string
  label: string
}

interface SelectDropdownProps {
  options: SelectOption[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  className,
}: SelectDropdownProps) {
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
      <GlowWrapper>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'w-full h-11 px-4 rounded-[10px] text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer bg-white/10',
            current ? 'text-nav-text' : 'text-nav-text/45',
          )}
          style={{ boxShadow: 'var(--shadow-input)' }}
        >
          <span>{current?.label ?? placeholder}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-nav-text/75 shrink-0 transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </button>
      </GlowWrapper>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border border-white/10 shadow-xl overflow-hidden"
            style={{ background: 'var(--nav-bg)' }}
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
                  'w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer',
                  value === opt.value
                    ? 'text-primary font-medium bg-primary/10'
                    : 'text-nav-text/90 hover:bg-white/8',
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
