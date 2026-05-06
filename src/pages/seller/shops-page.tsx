import { Link } from 'react-router-dom'
import { Store, Plus, BadgeCheck, Clock, MapPin, Truck, Pencil, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMyShops } from '@/hooks/use-my-shops'
import type { ShopDto } from '@/api/catalog'
import noImageUrl from '@/assets/no-image-available.jpg'

const BUSINESS_LABELS: Record<string, string> = {
  Individual: 'Частное лицо',
  SoleProprietor: 'ИП',
  SmallBusiness: 'ООО / компания',
}

function ShopSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 flex gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-40 bg-muted rounded-full" />
        <div className="h-3 w-24 bg-muted rounded-full" />
        <div className="h-3 w-32 bg-muted rounded-full" />
      </div>
    </div>
  )
}

function ShopCard({ shop }: { shop: ShopDto }) {
  const serviceRadiusKm = shop.serviceRadiusMeters
    ? Math.round(shop.serviceRadiusMeters / 100) / 10
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/60 p-5 flex gap-4 hover:bg-card/80 transition-colors"
    >
      {/* Avatar */}
      <Link to={`/seller/shops/${shop.id}/edit`} className="shrink-0">
        <img
          src={shop.avatarUrl ?? noImageUrl}
          alt={shop.businessName ?? ''}
          className="w-16 h-16 rounded-xl object-cover bg-muted border border-border"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <Link
                to={`/seller/shops/${shop.id}/edit`}
                className="font-semibold text-foreground hover:text-primary transition-colors truncate"
              >
                {shop.businessName ?? 'Без названия'}
              </Link>
              {shop.isVerified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
              {!shop.isActive && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Неактивен
                </span>
              )}
            </div>

            {shop.businessType != null && BUSINESS_LABELS[shop.businessType] && (
              <span className="text-xs text-muted-foreground">
                {BUSINESS_LABELS[shop.businessType]}
              </span>
            )}

            <div className="flex flex-wrap gap-1.5 mt-2">
              {shop.workingHours && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-muted/60 border border-border text-muted-foreground">
                  <Clock className="w-3 h-3 shrink-0" />
                  {shop.workingHours}
                </span>
              )}
              {serviceRadiusKm !== null && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-muted/60 border border-border text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {serviceRadiusKm} км
                </span>
              )}
              {shop.allowCourierDelivery && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Truck className="w-3 h-3 shrink-0" />
                  Доставка
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              to={`/shop/${shop.id}`}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Открыть страницу магазина"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/seller/shops/${shop.id}/edit`}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
              title="Редактировать"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ShopsPage() {
  const { shops, loading, error, reload } = useMyShops()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Мои магазины</h1>
          {!loading && shops.length > 0 && (
            <span className="text-sm text-muted-foreground">({shops.length})</span>
          )}
        </div>
        <Link
          to="/seller/shops/new"
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <ShopSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <button
            onClick={reload}
            className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Попробовать снова
          </button>
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-12 text-center">
          <Store className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">У вас ещё нет магазинов</p>
          <p className="text-xs text-muted-foreground mb-5">
            Создайте свой первый магазин, чтобы начать продавать
          </p>
          <Link
            to="/seller/shops/new"
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Создать магазин
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  )
}
