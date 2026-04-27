import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductSortBy } from '@/api/catalog'
import { SORT_OPTIONS, SORT_SEPARATORS, POPUP_ANIM, POPUP_BASE } from './filters-constants'

interface SortDropdownProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  open: boolean
  align: string
  activeValue?: ProductSortBy
  onToggle: () => void
  onSelect: (value: ProductSortBy) => void
}

export function SortDropdown({
  containerRef,
  open,
  align,
  activeValue,
  onToggle,
  onSelect,
}: SortDropdownProps) {
  const current = SORT_OPTIONS.find((o) => o.value === activeValue) ?? SORT_OPTIONS[0]
  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
          open
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
        )}
      >
        <current.Icon className="w-3.5 h-3.5 shrink-0" />
        {current.label}
        <ChevronDown
          className={cn('w-3 h-3 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div {...POPUP_ANIM} className={cn(POPUP_BASE, align, 'py-1 min-w-40')}>
            {SORT_OPTIONS.map((opt, i) => (
              <div key={opt.value}>
                {SORT_SEPARATORS.has(i) && <div className="my-1 border-t border-border/60" />}
                <button
                  onClick={() => onSelect(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer',
                    activeValue === opt.value
                      ? 'text-primary font-medium bg-primary/8'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <opt.Icon className="w-3.5 h-3.5 shrink-0" />
                  {opt.label}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface InStockToggleProps {
  checked: boolean
  onToggle: () => void
}

export function InStockToggle({ checked, onToggle }: InStockToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
        checked
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
          checked ? 'border-primary bg-primary' : 'border-border',
        )}
      >
        {checked && (
          <svg
            viewBox="0 0 12 12"
            className="w-2.5 h-2.5 fill-none stroke-primary-foreground stroke-2"
          >
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </span>
      Только в наличии
    </button>
  )
}

interface PriceRangeInputsProps {
  minPrice?: number
  maxPrice?: number
  onMinChange: (val: number | undefined) => void
  onMaxChange: (val: number | undefined) => void
}

export function PriceRangeInputs({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: PriceRangeInputsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">Цена, ₽</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          placeholder="от"
          value={minPrice ?? ''}
          onChange={(e) => onMinChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className="h-8 w-22.5 px-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 input-no-spin"
        />
        <span className="text-muted-foreground text-xs">—</span>
        <input
          type="number"
          min={0}
          placeholder="до"
          value={maxPrice ?? ''}
          onChange={(e) => onMaxChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className="h-8 w-22.5 px-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 input-no-spin"
        />
      </div>
    </div>
  )
}
