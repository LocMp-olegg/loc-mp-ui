import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/product-card'
import { type CarouselApi, Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useCarouselProgress } from '@/hooks/use-carousel-progress'
import { useLazyCategoryProducts } from '@/hooks/use-lazy-category-products'
import type { LeafCategory } from '@/lib/catalog'
import { cn, pluralize } from '@/lib/utils'

interface Props {
  category: LeafCategory
}

const SKELETON_COUNT = 5

export function CategorySection({ category }: Props) {
  const { products, loading, ref } = useLazyCategoryProducts(category.id)
  const [api, setApi] = useState<CarouselApi>()
  const { scrollProgress, canScrollPrev, canScrollNext } = useCarouselProgress(api)

  const hasMore = !loading && products.length >= 10
  const canScroll = canScrollPrev || canScrollNext

  return (
    <section
      ref={ref}
      className="mb-4 md:mb-5 mx-2 md:mx-4 rounded-2xl border border-white/20 dark:border-white/8 shadow-sm backdrop-blur-sm overflow-hidden"
      style={{ background: 'color-mix(in srgb, var(--card) 35%, transparent)' }}
    >
      <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-5 pt-4 md:pt-5">
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

        {canScroll && (
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <button
              onClick={() => api?.scrollPrev()}
              aria-label="Прокрутить влево"
              disabled={!canScrollPrev}
              className={cn(
                'w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer',
                canScrollPrev
                  ? 'border-border bg-card hover:bg-muted text-foreground'
                  : 'border-border/40 bg-transparent text-muted-foreground/30 cursor-default',
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => api?.scrollNext()}
              aria-label="Прокрутить вправо"
              disabled={!canScrollNext}
              className={cn(
                'w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer',
                canScrollNext
                  ? 'border-border bg-card hover:bg-muted text-foreground'
                  : 'border-border/40 bg-transparent text-muted-foreground/30 cursor-default',
              )}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative px-3 md:px-4 pb-4 md:pb-5">
        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            dragFree: false,
            watchDrag: (_, evt) => !(evt.target as HTMLElement).closest('[data-image-slider]'),
          }}
          className="py-2"
        >
          <CarouselContent>
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <CarouselItem
                    key={i}
                    className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                  >
                    <div className="rounded-2xl bg-muted animate-pulse" style={{ height: 340 }} />
                  </CarouselItem>
                ))
              : products.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                  >
                    <ProductCard product={product} className="w-full" />
                  </CarouselItem>
                ))}

            {hasMore && (
              <CarouselItem className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                <Link
                  to={`/category/${category.id}`}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border hover:border-primary hover:bg-muted transition-colors text-muted-foreground hover:text-primary h-full min-h-85"
                  aria-label={`Смотреть все в категории ${category.name}`}
                >
                  <div className="w-9 h-9 rounded-full border border-current flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-center px-2">Смотреть все</span>
                </Link>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>

        {!loading && canScroll && (
          <div className="mt-1 mx-1 h-1 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/50"
              style={{ width: `${scrollProgress * 100}%`, transition: 'width 0ms' }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
