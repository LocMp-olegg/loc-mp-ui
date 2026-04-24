import { useRef } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/product-card'
import { useLazyCategoryProducts } from '@/hooks/use-lazy-category-products'
import type { LeafCategory } from '@/lib/catalog'

interface Props {
  category: LeafCategory
}

const SKELETON_COUNT = 4

export function CategorySection({ category }: Props) {
  const { products, loading, ref } = useLazyCategoryProducts(category.id)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right'): void => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    })
  }

  return (
    <section ref={ref} className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{category.emoji}</span>
          <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
          {!loading && (
            <span className="text-sm text-muted-foreground font-normal">{products.length}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            aria-label="Прокрутить влево"
            className="w-7 h-7 rounded-full border border-border hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Прокрутить вправо"
            className="w-7 h-7 rounded-full border border-border hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <Link
            to={`/category/${category.id}`}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors ml-1"
          >
            Все <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 py-2"
        >
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="w-56 shrink-0 rounded-2xl bg-muted animate-pulse"
                  style={{ height: 340 }}
                />
              ))
            : products.map((product) => <ProductCard key={product.id} product={product} />)}

          {!loading && products.length >= 10 && (
            <Link
              to={`/category/${category.id}`}
              className="shrink-0 w-40 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border hover:border-primary hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
              aria-label={`Смотреть все в категории ${category.name}`}
            >
              <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-center px-3">Смотреть все</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
