import { useState, useCallback } from 'react'
import { PackageSearch } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useCatalogHome } from '@/hooks/use-catalog-home'
import { useUserLocation } from '@/contexts/location-context'
import { CategorySection } from '@/components/catalog/category-section'
import { ProductFiltersBar } from '@/components/catalog/product-filters-bar'
import { LocationPicker } from '@/components/location/location-picker'
import { useFilterParams } from '@/hooks/use-filter-params'
import { useScrollRestore } from '@/hooks/use-scroll-restore'

export function HomePage() {
  const { data, loading, error } = useCatalogHome()
  const { location } = useUserLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilterUrl] = useFilterParams()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadResults, setLoadResults] = useState<Record<string, boolean>>({})

  useScrollRestore(!loading && !!data)

  const activeRootId = searchParams.get('root') ?? 'all'

  const setActiveRootId = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id === 'all') next.delete('root')
          else next.set('root', id)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const visibleLeaves =
    activeRootId === 'all'
      ? (data?.leafCategories ?? [])
      : (data?.leafCategories ?? []).filter((c) => c.rootCategoryId === activeRootId)

  const handleLoadComplete = useCallback(
    (categoryId: string, hasProducts: boolean) => {
      setLoadResults((prev) => ({ ...prev, [`${activeRootId}:${categoryId}`]: hasProducts }))
    },
    [activeRootId],
  )

  const filterKey = `${activeRootId}:${filter.sort ?? ''}:${filter.minPrice ?? ''}:${filter.maxPrice ?? ''}:${filter.isInStock ?? ''}`

  const currentKeys = visibleLeaves.map((c) => `${activeRootId}:${c.id}`)
  const allLoaded = currentKeys.length > 0 && currentKeys.every((k) => k in loadResults)
  const allEmpty = allLoaded && currentKeys.every((k) => !loadResults[k])

  const isFiltered = activeRootId !== 'all'
  const activeCategory = data?.rootCategories.find((c) => c.id === activeRootId)

  const handleRootChange = (id: string) => {
    setActiveRootId(id)
    setLoadResults({})
  }

  const handleFilterChange = (next: typeof filter) => {
    setFilterUrl(next)
    setLoadResults({})
  }

  const handleFilterReset = () => {
    setFilterUrl({ sort: filter.sort, isInStock: true })
    setLoadResults({})
  }

  const filterPill = (id: string, emoji: string, label: string) => (
    <button
      key={id}
      onClick={() => handleRootChange(id)}
      className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
        activeRootId === id
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-muted shadow-sm'
      }`}
    >
      <span>{emoji}</span> {label}
    </button>
  )

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-6">
      <div className="px-4 md:px-6 mb-4 md:mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-0.5">
          Товары рядом с вами 📍
        </h1>
        <p className="text-muted-foreground text-sm">Товары из вашего района</p>
      </div>

      {loading ? (
        <div className="flex gap-2 px-4 md:px-6 pb-3 mb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse shrink-0" />
          ))}
        </div>
      ) : !error && data ? (
        <div className="px-4 md:px-6 pb-3 mb-2 flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterPill('all', '🏪', 'Все')}
            {data.rootCategories.map((cat) => filterPill(cat.id, cat.emoji, cat.name))}
          </div>
          <div className="flex items-center justify-end">
            <ProductFiltersBar
              filter={filter}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              disableSort={!!location}
            />
          </div>
        </div>
      ) : null}

      {error && (
        <div className="px-4 md:px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">Не удалось загрузить каталог</p>
          <p className="text-muted-foreground/60 text-xs mt-1">{error}</p>
        </div>
      )}

      {allEmpty && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-4xl">
              {isFiltered && activeCategory ? activeCategory.emoji : '🏪'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center">
              <PackageSearch className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Нет товаров поблизости</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {isFiltered && activeCategory
              ? `В категории «${activeCategory.name}» пока нет товаров`
              : 'В вашем районе пока нет товаров'}
            {location
              ? ` в радиусе ${location.radius < 1 ? `${Math.round(location.radius * 1000)} м` : `${location.radius} км`}.`
              : '.'}{' '}
            Попробуйте расширить радиус или выбрать другой район.
          </p>
          <div className="flex gap-2 mt-6">
            {isFiltered && (
              <button
                onClick={() => handleRootChange('all')}
                className="px-5 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
              >
                Все товары
              </button>
            )}
            <button
              onClick={() => setPickerOpen(true)}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Изменить район
            </button>
          </div>
        </div>
      )}

      {!error &&
        visibleLeaves.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            filterKey={filterKey}
            filter={filter}
            onLoadComplete={handleLoadComplete}
          />
        ))}

      <AnimatePresence>
        {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
