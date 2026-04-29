import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { AnimatePresence, motion } from 'framer-motion'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

interface DropdownProps {
  value?: number | string
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
  children?: React.ReactNode
  caption?: React.ReactNode
  className?: string
}

function CalendarDropdown({ value, onChange, children }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const options = React.Children.toArray(children)
    .filter((child): child is React.ReactElement<{ value: number | string; children: string }> =>
      React.isValidElement(child),
    )
    .map((child) => ({ value: child.props.value, label: String(child.props.children) }))

  const current = options.find((o) => o.value === value)

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

  const handleSelect = (optValue: number | string) => {
    onChange?.({ target: { value: String(optValue) } } as React.ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-lg border text-sm font-medium transition-colors cursor-pointer',
          open
            ? 'border-primary/50 text-foreground bg-muted'
            : 'border-border/50 text-foreground hover:border-primary/40 hover:bg-muted',
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
            {options.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                data-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer whitespace-nowrap',
                  opt.value === value
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
      className={cn('p-3 select-none', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-2',
        caption: 'flex justify-center relative items-center h-9',
        caption_label: 'text-sm font-semibold text-foreground',
        caption_dropdowns: 'flex items-center gap-1',
        nav: 'absolute inset-0 flex items-center justify-between pointer-events-none',
        nav_button:
          'pointer-events-auto h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted transition-colors cursor-pointer',
        nav_button_previous: '',
        nav_button_next: '',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'text-muted-foreground w-9 py-1 font-normal text-xs text-center',
        row: 'flex w-full',
        cell: 'h-9 w-9 text-center text-sm p-0 relative focus-within:z-20',
        day: 'h-9 w-9 rounded-lg text-sm font-normal text-foreground hover:bg-muted transition-colors cursor-pointer',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        day_today: 'font-bold text-primary',
        day_outside: 'text-muted-foreground/40',
        day_disabled: 'text-muted-foreground/30 cursor-not-allowed hover:bg-transparent',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        Dropdown: CalendarDropdown,
      }}
      {...props}
    />
  )
}
