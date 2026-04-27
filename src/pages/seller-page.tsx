import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Store, BadgeCheck, Clock, MapPin, Truck } from 'lucide-react'
import { useSellerDetail } from '@/hooks/use-seller-detail'
import { ShopReviewsModal } from '@/components/shop/reviews-modal'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'
import { pluralize } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'

const BUSINESS_LABELS: Record<string, string> = {
  Individual: 'Частное лицо',
  SoleProprietor: 'ИП',
  SmallBusiness: 'ООО / компания',
}

function SellerSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 animate-pulse">
      <div className="h-5 w-24 bg-muted rounded-full mb-6" />
      <div className="flex gap-5 mb-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-muted shrink-0" />
        <div className="flex-1 flex flex-col gap-3 pt-1">
          <div className="h-7 w-44 bg-muted rounded-xl" />
          <div className="h-4 w-28 bg-muted rounded-full" />
        </div>
      </div>
      <div className="h-5 w-32 bg-muted rounded-full mb-3 ml-2" />
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

function SellerContent({ id }: { id: string }) {
  const { seller, shops, rating, loading, error } = useSellerDetail(id)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [avatarLightbox, setAvatarLightbox] = useState(false)

  if (loading) return <SellerSkeleton />

  if (error || !seller) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-3">{error ?? 'Продавец не найден'}</p>
        <Link to="/" className="text-primary text-sm hover:underline">
          На главную
        </Link>
      </div>
    )
  }

  const reviewCount = rating?.reviewCount ?? seller.reviewCount ?? 0
  const avgRating = rating?.averageRating ?? seller.averageRating ?? 0
  const avatarSrc = seller.avatarUrl ?? noImageUrl
  const displayName = seller.displayName ?? 'Продавец'

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
      {/* Back */}
      <Link
        to={-1 as unknown as string}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-5 mb-8">
        {/* Avatar */}
        <div className="shrink-0">
          <button
            onClick={() => setAvatarLightbox(true)}
            className="block cursor-pointer rounded-2xl overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity"
          >
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
            />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground leading-tight mb-1">{displayName}</h1>

          {reviewCount > 0 ? (
            <button
              onClick={() => setReviewsOpen(true)}
              className="flex items-center gap-1.5 mb-2 cursor-pointer group"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                · {reviewCount} {pluralize(reviewCount, 'отзыв', 'отзыва', 'отзывов')}
              </span>
            </button>
          ) : (
            <p className="text-sm text-muted-foreground mb-2">Пока нет отзывов</p>
          )}
        </div>
      </div>

      {/* Shops */}
      {shops.length > 0 && (
        <section>
          <div className="flex items-center gap-2 px-2 mb-3">
            <Store className="w-4 h-4 text-muted-foreground shrink-0" />
            <h2 className="text-lg font-semibold text-foreground">
              {shops.length === 1 ? 'Магазин' : 'Магазины'}
            </h2>
            {shops.length > 1 && (
              <span className="text-sm text-muted-foreground">({shops.length})</span>
            )}
          </div>

          <div className="space-y-3">
            {shops.map((shop) => {
              const serviceRadiusKm = shop.serviceRadiusMeters
                ? Math.round(shop.serviceRadiusMeters / 100) / 10
                : null
              return (
                <Link
                  key={shop.id}
                  to={`/shop/${shop.id}`}
                  className="flex gap-4 p-4 rounded-2xl border border-white/20 dark:border-white/8 shadow-sm backdrop-blur-sm hover:opacity-90 transition-opacity"
                  style={{ background: 'color-mix(in srgb, var(--card) 35%, transparent)' }}
                >
                  <img
                    src={shop.avatarUrl ?? noImageUrl}
                    alt={shop.businessName ?? ''}
                    className="w-14 h-14 rounded-xl object-cover bg-muted shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-semibold text-foreground leading-tight">
                        {shop.businessName}
                      </span>
                      {shop.isVerified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      {shop.businessType && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {BUSINESS_LABELS[shop.businessType] ?? shop.businessType}
                        </span>
                      )}
                    </div>

                    {shop.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                        {shop.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      {shop.workingHours && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 border border-border">
                          <Clock className="w-3 h-3 shrink-0" />
                          {shop.workingHours}
                        </span>
                      )}
                      {serviceRadiusKm !== null && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 border border-border">
                          <MapPin className="w-3 h-3 shrink-0" />
                          до {serviceRadiusKm} км
                        </span>
                      )}
                      {shop.allowCourierDelivery && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          <Truck className="w-3 h-3 shrink-0" />
                          Доставка
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <AnimatePresence>
        {avatarLightbox && (
          <PhotoLightbox
            photos={[avatarSrc]}
            initialIndex={0}
            onClose={() => setAvatarLightbox(false)}
          />
        )}
        {reviewsOpen && (
          <ShopReviewsModal
            sellerId={id}
            shopName={displayName}
            aggregate={rating}
            title="Отзывы о продавце"
            onClose={() => setReviewsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function SellerPage() {
  const { id } = useParams<{ id: string }>()
  return <SellerContent key={id} id={id ?? ''} />
}
