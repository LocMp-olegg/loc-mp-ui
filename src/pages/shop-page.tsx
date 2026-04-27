import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Truck,
  BadgeCheck,
  Store,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useShopDetail } from '@/hooks/use-shop-detail'
import { useShopFilteredProducts } from '@/hooks/use-shop-filtered-products'
import { ProductCard } from '@/components/product/product-card'
import { ShopReviewsModal } from '@/components/shop/reviews-modal'
import { ShopGalleryModal } from '@/components/shop/gallery-modal'
import { ShopProductSection } from '@/components/shop/shop-product-section'
import { ShopProductFilters } from '@/components/shop/shop-product-filters'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'
import { type CarouselApi, Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useCarouselProgress } from '@/hooks/use-carousel-progress'
import { pluralize, cn } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'
import type { ShopProductFilter } from '@/lib/catalog'

const BUSINESS_LABELS: Record<string, string> = {
  Individual: 'Частное лицо',
  SoleProprietor: 'ИП',
  SmallBusiness: 'ООО / компания',
}

function ShopSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 animate-pulse">
      <div className="h-5 w-24 bg-muted rounded-full mb-6" />
      <div className="flex gap-5 mb-8">
        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-muted shrink-0" />
        <div className="flex-1 flex flex-col gap-3 pt-1">
          <div className="h-7 w-48 bg-muted rounded-xl" />
          <div className="h-4 w-32 bg-muted rounded-full" />
          <div className="h-4 w-24 bg-muted rounded-full" />
          <div className="h-4 w-64 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  )
}

function ShopContent({ id }: { id: string }) {
  const {
    shop,
    products,
    categoryGroups,
    rootCategoriesInShop,
    leafToRoot,
    rating,
    loading,
    error,
  } = useShopDetail(id)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [avatarLightbox, setAvatarLightbox] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState<number | null>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const { canScrollPrev, canScrollNext } = useCarouselProgress(carouselApi)
  const [viewMode, setViewMode] = useState<'categories' | 'grid'>('categories')
  const [filter, setFilter] = useState<ShopProductFilter>({ sort: 'Newest', isInStock: true })
  const {
    products: filteredProducts,
    loading: filteredLoading,
    hasNextPage: filteredHasMore,
    loadMore: filteredLoadMore,
  } = useShopFilteredProducts(id, filter, leafToRoot)

  if (loading) return <ShopSkeleton />

  if (error || !shop) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-3">{error ?? 'Магазин не найден'}</p>
        <Link to="/" className="text-primary text-sm hover:underline">
          На главную
        </Link>
      </div>
    )
  }

  const reviewCount = rating?.reviewCount ?? 0
  const avgRating = rating?.averageRating ?? 0
  const avatarSrc = shop.avatarUrl ?? noImageUrl

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      {/* Back */}
      <Link
        to={-1 as unknown as string}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>

      {/* Shop header */}
      <div className="flex flex-col sm:flex-row gap-5 mb-8">
        {/* Avatar — large, clickable */}
        <div className="shrink-0">
          <button
            onClick={() => setAvatarLightbox(true)}
            className="block cursor-pointer rounded-2xl overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity"
          >
            <img
              src={avatarSrc}
              alt={shop.name}
              className="w-32 h-32 sm:w-36 sm:h-36 object-cover"
            />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{shop.name}</h1>
            {shop.isVerified && <BadgeCheck className="w-5 h-5 text-primary shrink-0" />}
            {shop.businessType && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {BUSINESS_LABELS[shop.businessType] ?? shop.businessType}
              </span>
            )}
          </div>

          {/* Seller name */}
          {shop.sellerDisplayName && (
            <Link
              to={`/seller/${shop.sellerId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              {shop.sellerDisplayName}
            </Link>
          )}

          {/* Rating — clickable */}
          {reviewCount > 0 && (
            <button
              onClick={() => setReviewsOpen(true)}
              className="flex items-center gap-1.5 mb-3 cursor-pointer group"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                · {reviewCount} {pluralize(reviewCount, 'отзыв', 'отзыва', 'отзывов')}
              </span>
            </button>
          )}

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {shop.workingHours && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {shop.workingHours}
              </span>
            )}
            {shop.serviceRadiusKm !== null && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                Обслуживает до {shop.serviceRadiusKm} км
              </span>
            )}
            {shop.allowCourierDelivery && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                Доставка курьером
              </span>
            )}
          </div>

          {/* Description */}
          {shop.description && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{shop.description}</p>
          )}
        </div>
      </div>

      {/* Gallery island */}
      {shop.photos.length > 0 && (
        <section
          className="mb-4 md:mb-5 rounded-2xl border border-white/20 dark:border-white/8 shadow-sm backdrop-blur-sm overflow-hidden"
          style={{ background: 'color-mix(in srgb, var(--card) 35%, transparent)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-5 pt-4 md:pt-5 mb-3">
            <button
              onClick={() => setGalleryOpen(true)}
              className="flex items-center gap-2 group min-w-0"
            >
              <h2 className="text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                Фото магазина
              </h2>
              <span className="text-sm text-muted-foreground shrink-0">({shop.photos.length})</span>
            </button>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              <button
                onClick={() => carouselApi?.scrollPrev()}
                disabled={!canScrollPrev}
                aria-label="Назад"
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
                onClick={() => carouselApi?.scrollNext()}
                disabled={!canScrollNext}
                aria-label="Вперёд"
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
          </div>

          {/* Carousel */}
          <div className="px-3 md:px-4 pb-4 md:pb-5">
            <Carousel setApi={setCarouselApi} opts={{ align: 'start', dragFree: true }}>
              <CarouselContent>
                {shop.photos.map((photo, i) => (
                  <CarouselItem key={i} className="basis-1/3 sm:basis-1/4 md:basis-1/5">
                    <button
                      onClick={() => setPhotoLightboxIndex(i)}
                      className="block w-full aspect-square rounded-xl overflow-hidden border border-white/20 dark:border-white/8 bg-muted hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>
      )}

      {/* Products header + view toggle */}
      <div className="mb-3 px-2 flex items-center gap-2">
        <Store className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex items-baseline gap-1.5 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Товары магазина</h2>
          {products.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {products.length} {pluralize(products.length, 'товар', 'товара', 'товаров')}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setViewMode('categories')}
            aria-label="По категориям"
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer',
              viewMode === 'categories'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            По категориям
          </button>
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Сеткой"
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs border transition-colors cursor-pointer',
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            Все товары
          </button>
        </div>
      </div>

      {products.length === 0 && !loading ? (
        <div className="rounded-2xl border border-border bg-card/40 px-6 py-12 text-center mx-2">
          <p className="text-muted-foreground text-sm">В этом магазине пока нет товаров</p>
        </div>
      ) : viewMode === 'categories' ? (
        /* Category islands */
        <>
          {categoryGroups.map((group) => (
            <ShopProductSection
              key={group.id}
              group={group}
              onViewAll={(catId) => {
                setViewMode('grid')
                setFilter((f) => ({ ...f, categoryId: catId }))
              }}
            />
          ))}
        </>
      ) : (
        /* Flat grid with filters */
        <>
          <ShopProductFilters
            rootCategories={rootCategoriesInShop}
            categories={categoryGroups.map((g) => ({
              id: g.id,
              name: g.name,
              emoji: g.emoji,
              rootCategoryId: g.rootCategoryId,
            }))}
            filter={filter}
            onChange={setFilter}
            onReset={() => setFilter({ sort: 'Newest' })}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-2">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} className="w-full" />
            ))}
            {filteredLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-muted animate-pulse"
                  style={{ height: 340 }}
                />
              ))}
          </div>
          {filteredHasMore && !filteredLoading && (
            <div className="flex justify-center mt-8">
              <button
                onClick={filteredLoadMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
              >
                Показать ещё
              </button>
            </div>
          )}
          {filteredLoading && (
            <div className="flex justify-center mt-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {avatarLightbox && (
          <PhotoLightbox
            photos={[avatarSrc]}
            initialIndex={0}
            onClose={() => setAvatarLightbox(false)}
          />
        )}
        {photoLightboxIndex !== null && (
          <PhotoLightbox
            photos={shop.photos}
            initialIndex={photoLightboxIndex}
            onClose={() => setPhotoLightboxIndex(null)}
          />
        )}
        {galleryOpen && (
          <ShopGalleryModal
            photos={shop.photos}
            shopName={shop.name}
            onClose={() => setGalleryOpen(false)}
          />
        )}
        {reviewsOpen && (
          <ShopReviewsModal
            sellerId={shop.sellerId}
            shopName={shop.name}
            aggregate={rating}
            onClose={() => setReviewsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function ShopPage() {
  const { id } = useParams<{ id: string }>()
  return <ShopContent key={id} id={id ?? ''} />
}
