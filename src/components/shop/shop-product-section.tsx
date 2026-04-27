import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/product/product-card'
import { type CarouselApi, Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useCarouselProgress } from '@/hooks/use-carousel-progress'
import { cn, pluralize } from '@/lib/utils'
import type { CategoryGroup } from '@/hooks/use-shop-detail'

interface Props {
  group: CategoryGroup
  onViewAll: (categoryId: string) => void
}

export function ShopProductSection({ group, onViewAll }: Props) {
  const [api, setApi] = useState<CarouselApi>()
  const { canScrollPrev, canScrollNext, scrollProgress } = useCarouselProgress(api)

  const canScroll = canScrollPrev || canScrollNext

  return (
    <section
      className="mb-4 md:mb-5 rounded-2xl border border-white/20 dark:border-white/8 shadow-sm backdrop-blur-sm overflow-hidden"
      style={{ background: 'color-mix(in srgb, var(--card) 35%, transparent)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4 px-4 md:px-5 pt-4 md:pt-5">
        <button
          onClick={() => onViewAll(group.id)}
          className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
        >
          <span className="text-xl md:text-2xl leading-none shrink-0">{group.emoji}</span>
          <div className="flex flex-col items-start min-w-0">
            <h2 className="text-base md:text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">
              {group.name}
            </h2>
            <span className="text-xs text-muted-foreground mt-0.5">
              {group.products.length}{' '}
              {pluralize(group.products.length, 'товар', 'товара', 'товаров')}
            </span>
          </div>
        </button>

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

      {/* Carousel */}
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
            {group.products.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <ProductCard product={product} className="w-full" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {canScroll && (
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
