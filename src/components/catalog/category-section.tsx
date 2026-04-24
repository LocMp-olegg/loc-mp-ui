import { useRef } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/product-card'
import type { Category } from '@/types/product'

interface Props {
  category: Category
}

export function CategorySection({ category }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right'): void => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl md:text-3xl leading-none" aria-hidden="true">
            {category.emoji}
          </span>
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight tracking-tight">
              {category.name}
            </h2>
            <span className="text-xs font-medium text-muted-foreground mt-0.5">
              {category.products.length} товаров
            </span>
          </div>
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
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 py-2"
        >
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
