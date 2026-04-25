import { useState } from 'react'
import { useCatalogHome } from '@/hooks/use-catalog-home'
import { CategorySection } from '@/components/catalog/category-section'

export function HomePage() {
  const { data, loading, error } = useCatalogHome()
  const [activeRootId, setActiveRootId] = useState<string>('all')

  const visibleSections =
    activeRootId === 'all'
      ? (data?.leafCategories ?? [])
      : (data?.leafCategories ?? []).filter((c) => c.rootCategoryId === activeRootId)

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-6">
      <div className="px-4 md:px-6 mb-4 md:mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-0.5">
          Товары рядом с вами 📍
        </h1>
        <p className="text-muted-foreground text-sm">Товары из вашего района</p>
      </div>

      {/* Filter pills — root categories */}
      {loading ? (
        <div className="flex gap-2 px-4 md:px-6 pb-3 mb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse shrink-0" />
          ))}
        </div>
      ) : !error && data ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-3 mb-2">
          <button
            onClick={() => setActiveRootId('all')}
            className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeRootId === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-muted shadow-sm'
            }`}
          >
            <span>🏪</span> Все
          </button>
          {data.rootCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveRootId(cat.id)}
              className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeRootId === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-muted shadow-sm'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      ) : null}

      {error && (
        <div className="px-4 md:px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">Не удалось загрузить каталог</p>
          <p className="text-muted-foreground/60 text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Sections render immediately — each loads its products lazily */}
      {!error &&
        visibleSections.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
    </div>
  )
}
