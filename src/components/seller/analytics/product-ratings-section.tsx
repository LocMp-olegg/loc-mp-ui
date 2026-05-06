import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Store, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProductRatings } from '@/hooks/use-seller-analytics'
import { StarRating } from '@/components/ui/star-rating'
import { cn } from '@/lib/utils'

export function ProductRatingsSection() {
  const { data, loading, error } = useProductRatings()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Рейтинг товаров</h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-14 bg-muted/50 rounded-xl animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-6">{error}</p>
      ) : !data ? null : (
        <>
          {/* Overall */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
            <div className="flex items-center gap-2">
              <StarRating rating={data.overallAverageRating ?? 0} size={20} />
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                {data.overallAverageRating?.toFixed(1) ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.totalReviewCount ?? 0} отзывов
              </p>
            </div>
          </div>

          {/* Shops */}
          <div className="space-y-2">
            {(data.shops ?? []).map((shop) => {
              const isOpen = expanded.has(shop.shopId ?? '')
              return (
                <div key={shop.shopId} className="rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggle(shop.shopId ?? '')}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer text-left"
                  >
                    <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {shop.shopName ?? 'Магазин'}
                    </span>
                    <StarRating rating={shop.shopAverageRating ?? 0} size={13} />
                    <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                      {shop.shopAverageRating?.toFixed(1) ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {shop.shopReviewCount ?? 0} отз.
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (shop.products ?? []).length > 0 && (
                      <motion.div
                        key="products"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-border">
                          {(shop.products ?? []).map((product) => (
                            <div
                              key={product.productId}
                              className="flex items-center gap-2.5 px-4 py-2.5 bg-background/10"
                            >
                              <Link
                                to={`/product/${product.productId}`}
                                className="flex-1 text-sm text-foreground truncate hover:text-primary hover:underline transition-colors"
                              >
                                {product.productName}
                              </Link>
                              <StarRating rating={product.averageRating ?? 0} size={12} />
                              <span className="text-sm font-medium text-foreground tabular-nums shrink-0 w-8 text-right">
                                {product.averageRating?.toFixed(1) ?? '—'}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">
                                {product.reviewCount ?? 0} отз.
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
