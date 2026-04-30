import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { DayPicker, type DropdownProps } from 'react-day-picker'
import { AnimatePresence, motion } from 'framer-motion'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CalendarDropdown({ value, onChange, options }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const current = options?.find((o) => o.value === value)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  React.useEffect(() => {
    if (!open || !listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
    selected?.scrollIntoView({ block: 'nearest' })
  }, [open])

  const handleSelect = (optValue: string | number) => {
    onChange?.({ target: { value: String(optValue) } } as React.ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-lg border text-sm font-medium transition-colors cursor-pointer',
          open
            ? 'border-primary/50 text-foreground bg-foreground/5'
            : 'border-border/50 text-foreground hover:border-primary/40 hover:bg-foreground/5',
        )}
      >
        {current?.label ?? '–'}
        <ChevronDown
          className={cn(
            'w-3 h-3 shrink-0 transition-transform duration-150 text-muted-foreground',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full mt-1 left-0 z-70 rounded-xl border border-border shadow-xl overflow-y-auto max-h-52 scrollbar-thin"
            style={{
              background: 'color-mix(in srgb, var(--card) 96%, transparent)',
              backdropFilter: 'blur(8px)',
              minWidth: '7.5rem',
            }}
          >
            {options?.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                data-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer whitespace-nowrap',
                  opt.value === value
                    ? 'text-primary font-medium bg-primary/10'
                    : 'text-foreground hover:bg-foreground/5',
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

export function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ru}
      showOutsideDays={showOutsideDays}
      className={cn('p-5 select-none', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-2',
        month_caption: 'flex justify-center relative items-center h-9 mb-1',
        caption_label: 'text-sm font-semibold text-foreground flex items-center gap-1',
        nav: 'absolute inset-0 flex items-center justify-between pointer-events-none z-10',

        button_previous:
          'pointer-events-auto h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors cursor-pointer',
        button_next:
          'pointer-events-auto h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors cursor-pointer',

        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground w-9 py-1 font-normal text-xs text-center',
        week: 'flex w-full mt-1',

        day: 'h-9 w-9 p-0 flex items-center justify-center',

        day_button: cn(
          'h-9 w-9 flex items-center justify-center rounded-lg text-sm font-normal transition-colors cursor-pointer outline-none',
          'hover:bg-white/10 focus-visible:bg-white/10',
        ),

        selected: cn(
          '!bg-primary !text-primary-foreground !rounded-lg',
          'hover:!bg-primary/80 hover:!text-primary-foreground',
          'focus:!bg-primary focus:!text-primary-foreground',
        ),

        today: 'font-bold text-primary',
        outside: 'text-muted-foreground/40',
        disabled: 'text-muted-foreground/30 cursor-not-allowed hover:bg-transparent',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />
          return <ChevronRight className="h-4 w-4" />
        },
        Dropdown: CalendarDropdown,
      }}
      {...props}
    />
  )
}
