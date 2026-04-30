import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GlowWrapper } from '@/components/ui/glow-input'
import * as React from 'react'

export function DatePickerField({
  value,
  onChange,
}: {
  value: string
  onChange: (iso: string) => void
}) {
  const [open, setOpen] = useState(false)
  const today = React.useMemo(() => new Date(), [])

  const selected = React.useMemo(() => (value ? new Date(value + 'T00:00:00') : undefined), [value])

  const [month, setMonth] = useState<Date>(selected || today)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setMonth(selected || today)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpenChange(true)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <GlowWrapper>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className={`w-full h-11 px-4 rounded-[10px] text-sm flex items-center gap-2.5 bg-white/10 transition-colors cursor-pointer outline-none ${
              selected ? 'text-nav-text' : 'text-nav-text/45'
            }`}
            style={{ boxShadow: 'var(--shadow-input)' }}
          >
            <CalendarIcon className="w-4 h-4 text-nav-text/75 shrink-0" />
            <span className="flex-1 text-left truncate min-w-0">
              {selected ? format(selected, 'dd.MM.yyyy') : 'дд.мм.гггг'}
            </span>

            <div className="flex items-center shrink-0 min-w-[20px] justify-end">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange('')
                  }}
                  className="p-1 text-nav-text/75 hover:text-nav-text transition-colors cursor-pointer rounded-full hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </PopoverTrigger>
      </GlowWrapper>

      <PopoverContent
        className="w-auto p-0 overflow-hidden z-50 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        align="start"
        sideOffset={8}
        collisionPadding={16}
      >
        <Calendar
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={new Date(1924, 0)}
          endMonth={new Date(today.getFullYear() - 1, 11)}
          disabled={(date) => date >= today}
          classNames={{ caption_label: 'hidden' }}
          onSelect={(day) => {
            const isoDate = day ? format(day, 'yyyy-MM-dd') : ''
            onChange(isoDate)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
