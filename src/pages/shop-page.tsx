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
} from 'lucide-react'
import { useShopDetail } from '@/hooks/use-shop-detail'
import { ProductCard } from '@/components/product/product-card'
import { ShopReviewsModal } from '@/components/shop/reviews-modal'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'
import { pluralize } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'

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
  const { shop, products, hasMoreProducts, loadingMore, rating, loading, error, loadMore } =
    useShopDetail(id)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [avatarLightbox, setAvatarLightbox] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

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

      {/* Gallery */}
      {shop.photos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Фото магазина</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {shop.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setGalleryIndex(i)}
                className="aspect-square rounded-xl overflow-hidden border border-border bg-muted hover:opacity-85 transition-opacity cursor-pointer"
              >
                <img src={photo} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <div className="mb-3 flex items-center gap-2">
        <Store className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Товары магазина</h2>
        {products.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {products.length} {pluralize(products.length, 'товар', 'товара', 'товаров')}
          </span>
        )}
      </div>

      {products.length === 0 && !loading ? (
        <div className="rounded-2xl border border-border bg-card/40 px-6 py-12 text-center">
          <p className="text-muted-foreground text-sm">В этом магазине пока нет товаров</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} className="w-full" />
            ))}
            {loadingMore &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-muted animate-pulse"
                  style={{ height: 340 }}
                />
              ))}
          </div>

          {hasMoreProducts && !loadingMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
              >
                Показать ещё
              </button>
            </div>
          )}
          {loadingMore && (
            <div className="flex justify-center mt-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {/* Lightboxes */}
      <AnimatePresence>
        {avatarLightbox && (
          <PhotoLightbox
            photos={[avatarSrc]}
            initialIndex={0}
            onClose={() => setAvatarLightbox(false)}
          />
        )}
        {galleryIndex !== null && (
          <PhotoLightbox
            photos={shop.photos}
            initialIndex={galleryIndex}
            onClose={() => setGalleryIndex(null)}
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
