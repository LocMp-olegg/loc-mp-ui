import { useState, useRef, useCallback, useEffect, useReducer } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  Search,
  CalendarArrowDown,
  CalendarArrowUp,
  TrendingUp,
  TrendingDown,
  ArrowUpAZ,
  ArrowDownAZ,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShopProductFilter } from '@/lib/catalog'
import type { ProductSortBy } from '@/api/catalog'
import * as React from 'react'

interface Category {
  id: string
  name: string
  emoji: string
  rootCategoryId: string
}

interface RootCategory {
  id: string
  name: string
  emoji: string
}

interface Props {
  rootCategories: RootCategory[]
  categories: Category[]
  filter: ShopProductFilter
  onChange: (filter: ShopProductFilter) => void
  onReset: () => void
}

const SORT_OPTIONS: {
  value: ProductSortBy
  label: string
  Icon: React.FC<{ className?: string }>
}[] = [
  { value: 'Newest', label: 'Новее', Icon: CalendarArrowDown },
  { value: 'Oldest', label: 'Старее', Icon: CalendarArrowUp },
  { value: 'PriceAsc', label: 'Дешевле', Icon: TrendingUp },
  { value: 'PriceDesc', label: 'Дороже', Icon: TrendingDown },
  { value: 'NameAsc', label: 'А → Я', Icon: ArrowUpAZ },
  { value: 'NameDesc', label: 'Я → А', Icon: ArrowDownAZ },
]

const SORT_SEPARATORS = new Set([2, 4])

const POPUP_ANIM = {
  initial: { opacity: 0, scale: 0.95, y: -6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -6 },
  transition: { duration: 0.13 },
} as const

type DraftAction =
  | { type: 'reset'; filter: ShopProductFilter }
  | { type: 'patch'; patch: Partial<ShopProductFilter> }

function draftReducer(_: ShopProductFilter, action: DraftAction): ShopProductFilter {
  if (action.type === 'reset') return action.filter
  return { ..._, ...action.patch }
}

function hasActiveFilters(f: ShopProductFilter): boolean {
  return !!(
    f.categoryId ||
    f.rootCategoryId ||
    f.minPrice !== undefined ||
    f.maxPrice !== undefined ||
    f.search
  )
}

interface SearchInputProps {
  initialValue: string
  onCommit: (value: string) => void
  onClear: () => void
}

function SearchInput({ initialValue, onCommit, onClear }: SearchInputProps) {
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (next: string) => {
      setValue(next)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onCommit(next), 350)
    },
    [onCommit],
  )

  const handleClear = useCallback(() => {
    setValue('')
    if (timerRef.current) clearTimeout(timerRef.current)
    onClear()
  }, [onClear])

  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder="Поиск по товарам..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-8 pl-8 pr-7 rounded-lg border border-border bg-card/50 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:bg-card/80 transition-colors"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function ShopProductFilters({
  rootCategories,
  categories,
  filter,
  onChange,
  onReset,
}: Props) {
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [draft, dispatchDraft] = useReducer(draftReducer, filter)
  const sortRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const active = hasActiveFilters(filter)
  const currentSort = SORT_OPTIONS.find((o) => o.value === filter.sort) ?? SORT_OPTIONS[0]

  useEffect(() => {
    dispatchDraft({ type: 'reset', filter })
  }, [filter])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openFilter = () => {
    dispatchDraft({ type: 'reset', filter })
    setFilterOpen((v) => !v)
    setSortOpen(false)
  }

  const applyFilters = () => {
    onChange(draft)
    setFilterOpen(false)
  }

  const resetFilters = () => {
    dispatchDraft({ type: 'reset', filter: { sort: filter.sort } })
    onReset()
    setFilterOpen(false)
  }

  const selectLeaf = (id: string) =>
    dispatchDraft({ type: 'patch', patch: { categoryId: id, rootCategoryId: undefined } })

  const selectRoot = (id: string) =>
    dispatchDraft({ type: 'patch', patch: { rootCategoryId: id, categoryId: undefined } })

  const selectAll = () =>
    dispatchDraft({ type: 'patch', patch: { categoryId: undefined, rootCategoryId: undefined } })

  const popupBase =
    'absolute right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-xl backdrop-blur-md origin-top-right'

  const pillBase =
    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap'
  const pillActive = 'bg-primary text-primary-foreground border-primary'
  const pillInactive =
    'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'

  const leafByRoot = new Map<string, Category[]>()
  for (const cat of categories) {
    const list = leafByRoot.get(cat.rootCategoryId) ?? []
    list.push(cat)
    leafByRoot.set(cat.rootCategoryId, list)
  }
  const hasHierarchy = rootCategories.length > 0

  return (
    <div className="mb-3 px-2">
      <div className="flex items-center gap-2">
        <SearchInput
          key={filter.search ?? '__empty__'}
          initialValue={filter.search ?? ''}
          onCommit={(val) => onChange({ ...filter, search: val || undefined })}
          onClear={() => onChange({ ...filter, search: undefined })}
        />

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative shrink-0">
          <button
            onClick={() => {
              setSortOpen((v) => !v)
              setFilterOpen(false)
            }}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
              sortOpen
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            <currentSort.Icon className="w-3.5 h-3.5 shrink-0" />
            {currentSort.label}
            <ChevronDown
              className={cn('w-3 h-3 transition-transform duration-150', sortOpen && 'rotate-180')}
            />
          </button>

          <AnimatePresence>
            {sortOpen && (
              <motion.div {...POPUP_ANIM} className={cn(popupBase, 'py-1 min-w-40')}>
                {SORT_OPTIONS.map((opt, i) => (
                  <div key={opt.value}>
                    {SORT_SEPARATORS.has(i) && <div className="my-1 border-t border-border/60" />}
                    <button
                      onClick={() => {
                        onChange({ ...filter, sort: opt.value })
                        setSortOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer',
                        filter.sort === opt.value
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

        {/* Filter popup */}
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
                className={cn(popupBase, 'p-3 flex flex-col gap-3 min-w-70')}
              >
                {/* Categories */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Категория</span>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-0.5">
                    <button
                      onClick={selectAll}
                      className={cn(
                        pillBase,
                        !draft.categoryId && !draft.rootCategoryId ? pillActive : pillInactive,
                      )}
                    >
                      Все товары
                    </button>

                    {hasHierarchy
                      ? rootCategories.map((root) => {
                          const children = leafByRoot.get(root.id) ?? []
                          if (children.length === 0) return null
                          const rootActive = draft.rootCategoryId === root.id
                          return (
                            <div key={root.id} className="flex flex-col gap-1.5">
                              <button
                                onClick={() => selectRoot(root.id)}
                                className={cn(
                                  pillBase,
                                  rootActive ? pillActive : pillInactive,
                                  'font-semibold',
                                )}
                              >
                                {root.emoji} {root.name}
                              </button>
                              <div className="flex flex-wrap gap-1.5 pl-3">
                                {children.map((cat) => (
                                  <button
                                    key={cat.id}
                                    onClick={() => selectLeaf(cat.id)}
                                    className={cn(
                                      pillBase,
                                      draft.categoryId === cat.id ? pillActive : pillInactive,
                                    )}
                                  >
                                    {cat.emoji} {cat.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })
                      : categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => selectLeaf(cat.id)}
                            className={cn(
                              pillBase,
                              draft.categoryId === cat.id ? pillActive : pillInactive,
                            )}
                          >
                            {cat.emoji} {cat.name}
                          </button>
                        ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Цена, ₽</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      placeholder="от"
                      value={draft.minPrice ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Number(e.target.value)
                        dispatchDraft({ type: 'patch', patch: { minPrice: val } })
                      }}
                      className="h-8 w-22.5 px-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 input-no-spin"
                    />
                    <span className="text-muted-foreground text-xs">—</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="до"
                      value={draft.maxPrice ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Number(e.target.value)
                        dispatchDraft({ type: 'patch', patch: { maxPrice: val } })
                      }}
                      className="h-8 w-22.5 px-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 input-no-spin"
                    />
                  </div>
                </div>

                {/* In stock */}
                <button
                  onClick={() =>
                    dispatchDraft({
                      type: 'patch',
                      patch: { isInStock: draft.isInStock === true ? undefined : true },
                    })
                  }
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                    draft.isInStock === true
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      draft.isInStock === true ? 'border-primary bg-primary' : 'border-border',
                    )}
                  >
                    {draft.isInStock === true && (
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

                {/* Actions */}
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
    </div>
  )
}
