import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GlowWrapper } from '@/components/ui/glow-input'

export function DatePickerField({
  value,
  onChange,
}: {
  value: string
  onChange: (iso: string) => void
}) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const selected = value ? new Date(value + 'T00:00:00') : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <GlowWrapper>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`w-full h-11 px-4 rounded-[10px] text-sm flex items-center gap-2.5 bg-white/10 transition-colors ${
              selected ? 'text-nav-text' : 'text-nav-text/45'
            }`}
            style={{ boxShadow: 'var(--shadow-input)' }}
          >
            <CalendarIcon className="w-4 h-4 text-nav-text/75 shrink-0" />
            {selected ? format(selected, 'dd.MM.yyyy') : 'дд.мм.гггг'}
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                }}
                className="ml-auto text-nav-text/75 hover:text-nav-text transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </button>
        </PopoverTrigger>
      </GlowWrapper>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date(1990, 0, 1)}
          captionLayout="dropdown"
          fromYear={1924}
          toYear={today.getFullYear() - 1}
          disabled={(date) => date >= today}
          classNames={{ caption_label: 'hidden' }}
          onSelect={(day) => {
            onChange(day ? format(day, 'yyyy-MM-dd') : '')
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
