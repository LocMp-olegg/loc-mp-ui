import { useState, useRef, useCallback, useEffect, useReducer } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShopProductFilter } from '@/lib/catalog'
import { POPUP_ANIM, POPUP_BASE, popupAlign } from '@/components/catalog/filters-constants'
import { SortDropdown, InStockToggle, PriceRangeInputs } from '@/components/catalog/filters-shared'
import { useClickOutside } from '@/hooks/use-click-outside'

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
  const [sortAlign, setSortAlign] = useState('right-0')
  const [filterAlign, setFilterAlign] = useState('right-0')
  const [draft, dispatchDraft] = useReducer(draftReducer, filter)
  const sortRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const active = hasActiveFilters(filter)

  useEffect(() => {
    dispatchDraft({ type: 'reset', filter })
  }, [filter])

  useClickOutside([
    { ref: sortRef, onClose: () => setSortOpen(false) },
    { ref: filterRef, onClose: () => setFilterOpen(false) },
  ])

  const openFilter = () => {
    setFilterAlign(popupAlign(filterRef, 280))
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
                className={cn(POPUP_BASE, filterAlign, 'p-3 flex flex-col gap-3 min-w-70')}
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
    </div>
  )
}
