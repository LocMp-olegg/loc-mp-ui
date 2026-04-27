import { useState, useRef, useEffect, useReducer } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductFilter } from '@/lib/catalog'
import { POPUP_ANIM, POPUP_BASE, popupAlign } from './filters-constants'
import { SortDropdown, InStockToggle, PriceRangeInputs } from './filters-shared'
import { useClickOutside } from '@/hooks/use-click-outside'

type Draft = Pick<ProductFilter, 'minPrice' | 'maxPrice' | 'isInStock'>
type DraftAction = { type: 'reset'; draft: Draft } | { type: 'patch'; patch: Partial<Draft> }

function draftReducer(_: Draft, action: DraftAction): Draft {
  if (action.type === 'reset') return action.draft
  return { ..._, ...action.patch }
}

function hasActiveFilters(f: Pick<ProductFilter, 'minPrice' | 'maxPrice'>): boolean {
  return f.minPrice !== undefined || f.maxPrice !== undefined
}

interface Props {
  filter: ProductFilter
  onChange: (filter: ProductFilter) => void
  onReset: () => void
  /** Hide sort (e.g. when /nearby endpoint is used which doesn't support sort) */
  disableSort?: boolean
}

export function ProductFiltersBar({ filter, onChange, onReset, disableSort }: Props) {
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortAlign, setSortAlign] = useState('right-0')
  const [filterAlign, setFilterAlign] = useState('right-0')
  const [draft, dispatchDraft] = useReducer(draftReducer, {
    minPrice: filter.minPrice,
    maxPrice: filter.maxPrice,
    isInStock: filter.isInStock,
  })
  const sortRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const active = hasActiveFilters(filter)

  useEffect(() => {
    dispatchDraft({
      type: 'reset',
      draft: { minPrice: filter.minPrice, maxPrice: filter.maxPrice, isInStock: filter.isInStock },
    })
  }, [filter])

  useClickOutside([
    { ref: sortRef, onClose: () => setSortOpen(false) },
    { ref: filterRef, onClose: () => setFilterOpen(false) },
  ])

  const openFilter = () => {
    setFilterAlign(popupAlign(filterRef, 240))
    dispatchDraft({
      type: 'reset',
      draft: { minPrice: filter.minPrice, maxPrice: filter.maxPrice, isInStock: filter.isInStock },
    })
    setFilterOpen((v) => !v)
    setSortOpen(false)
  }

  const applyFilters = () => {
    onChange({ ...filter, ...draft })
    setFilterOpen(false)
  }

  const resetFilters = () => {
    dispatchDraft({ type: 'reset', draft: {} })
    onReset()
    setFilterOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      {!disableSort && (
        <SortDropdown
          containerRef={sortRef}
          open={sortOpen}
          align={sortAlign}
          activeValue={filter.sort}
          onToggle={() => {
            setSortAlign(popupAlign(sortRef, 160))
            setSortOpen((v) => !v)
            setFilterOpen(false)
          }}
          onSelect={(value) => {
            onChange({ ...filter, sort: value })
            setSortOpen(false)
          }}
        />
      )}

      <div ref={filterRef} className="relative shrink-0">
        <button
          onClick={openFilter}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
            active || filterOpen
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Фильтры
          {active && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/70 shrink-0" />
          )}
        </button>

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              {...POPUP_ANIM}
              className={cn(POPUP_BASE, filterAlign, 'p-3 flex flex-col gap-3 min-w-60')}
            >
              <PriceRangeInputs
                minPrice={draft.minPrice}
                maxPrice={draft.maxPrice}
                onMinChange={(val) => dispatchDraft({ type: 'patch', patch: { minPrice: val } })}
                onMaxChange={(val) => dispatchDraft({ type: 'patch', patch: { maxPrice: val } })}
              />
              <InStockToggle
                checked={draft.isInStock === true}
                onToggle={() =>
                  dispatchDraft({
                    type: 'patch',
                    patch: { isInStock: draft.isInStock === true ? undefined : true },
                  })
                }
              />
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                {hasActiveFilters(draft) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Сбросить
                  </button>
                )}
                <button
                  onClick={applyFilters}
                  className="ml-auto px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Применить
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
