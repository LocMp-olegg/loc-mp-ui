import { useState } from 'react'
import { categories } from '@/data/mock-products'
import { CategorySection } from '@/components/catalog/category-section'

const ALL_ID = 'all'

const PILLS = [
  { id: ALL_ID, label: 'Все', emoji: '🏪' },
  { id: 'bakery', label: 'Выпечка', emoji: '🥐' },
  { id: 'produce', label: 'Овощи и фрукты', emoji: '🥦' },
  { id: 'handmade', label: 'Хендмейд', emoji: '🎨' },
  { id: 'clothing', label: 'Одежда', emoji: '👗' },
  { id: 'plants', label: 'Растения', emoji: '🌿' },
]

export function HomePage() {
  const [activeFilter, setActiveFilter] = useState(ALL_ID)

  const visibleCategories =
    activeFilter === ALL_ID ? categories : categories.filter((c) => c.id === activeFilter)

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-6">
      {/* Hero */}
      <div className="px-4 md:px-6 mb-4 md:mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-0.5">
          Товары рядом с вами 📍
        </h1>
        <p className="text-muted-foreground text-sm">Хамовники · 54 продавца в вашем районе</p>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-3 mb-2">
        {PILLS.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setActiveFilter(pill.id)}
            className={`flex items-center gap-1.5 px-3 md:px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeFilter === pill.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-muted shadow-sm'
            }`}
          >
            <span>{pill.emoji}</span>
            {pill.label}
          </button>
        ))}
      </div>

      {/* Category sections */}
      {visibleCategories.map((category) => (
        <CategorySection key={category.id} category={category} />
      ))}
    </div>
  )
}
