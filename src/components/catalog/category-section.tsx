import { useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/product-card'
import { useLazyCategoryProducts } from '@/hooks/use-lazy-category-products'
import type { LeafCategory } from '@/lib/catalog'
import { pluralize } from '@/lib/utils'

interface Props {
  category: LeafCategory
}

const SKELETON_COUNT = 4
const SCROLL_THRESHOLD = 4

export function CategorySection({ category }: Props) {
  const { products, loading, ref } = useLazyCategoryProducts(category.id)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const scroll = (direction: 'left' | 'right'): void => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    })
  }

  const canScroll = loading || products.length >= SCROLL_THRESHOLD
  const hasMore = !loading && products.length >= 10

  return (
    <section ref={ref} className="mb-8 md:mb-10">
      {/* Header — clean, no arrows */}
      <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-6">
        <Link to={`/category/${category.id}`} className="flex items-center gap-2.5 min-w-0 group">
          <span className="text-xl md:text-2xl leading-none shrink-0">{category.emoji}</span>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base md:text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
              {category.name}
            </h2>
            {!loading && (
              <span className="text-xs text-muted-foreground mt-0.5">
                {products.length} {pluralize(products.length, 'товар', 'товара', 'товаров')}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Scroll row with inline arrows */}
      <div className="relative group/row">
        {/* Left fade + arrow — only when scrolled right */}
        {canScroll && canScrollLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('left')}
              aria-label="Прокрутить влево"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card border border-border shadow-md items-center justify-center cursor-pointer transition-all opacity-0 group-hover/row:opacity-100 hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </>
        )}

        {/* Right fade + arrow — only when more content to the right */}
        {canScroll && canScrollRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll('right')}
              aria-label="Прокрутить вправо"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card border border-border shadow-md items-center justify-center cursor-pointer transition-all opacity-0 group-hover/row:opacity-100 hover:bg-muted"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 py-2 snap-x snap-mandatory scroll-pl-4 md:scroll-pl-6"
        >
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="w-56 flex-shrink-0 snap-start rounded-2xl bg-muted animate-pulse"
                  style={{ height: 340 }}
                />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} className="snap-start" />
              ))}

          {hasMore && (
            <Link
              to={`/category/${category.id}`}
              className="shrink-0 w-36 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border hover:border-primary hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
              aria-label={`Смотреть все в категории ${category.name}`}
            >
              <div className="w-9 h-9 rounded-full border border-current flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-center px-2">Смотреть все</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
