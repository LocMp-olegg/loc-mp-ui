import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Minus, Plus, ShoppingCart, Star, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductImageSlider } from './product-image-slider'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { useProductActions } from '@/hooks/use-product-actions'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'
import * as React from 'react'

interface Props {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: Props) {
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const { quantity, isFavorite, onAdd, onDecrement, onIncrement, onToggleFavorite } =
    useProductActions(product)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  return (
    <motion.article
      className={cn(
        'relative flex flex-col bg-card/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 overflow-hidden select-none w-56 shrink-0 group',
        className,
      )}
      onMouseMove={handleMouseMove}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        boxShadow: isHovered ? '0 12px 20px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Aceternity spotlight */}
      <div
        className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
        style={{
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
          background: `radial-gradient(300px at ${spotlightPos.x}px ${spotlightPos.y}px, var(--spotlight), transparent 80%)`,
        }}
      />

      <Link to={`/product/${product.id}`} className="block flex-1 p-2 pb-0">
        <div className="rounded-2xl overflow-hidden relative">
          <ProductImageSlider images={product.images} alt={product.name} />
          <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        <div className="px-2 pt-3 pb-2">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 min-h-10">
              {product.name}
            </p>
            <button
              onClick={onToggleFavorite}
              className="shrink-0 w-8 h-8 flex items-center justify-center relative z-20 group"
            >
              <div
                className={cn(
                  'absolute inset-0 rounded-full transition-all duration-500',
                  isHovered ? 'bg-white/10 blur-sm scale-110' : 'scale-0',
                )}
              />
              <div className="relative">
                <Heart
                  className={cn(
                    'w-4 h-4 transition-all duration-300',
                    isFavorite
                      ? 'fill-destructive text-destructive filter drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] scale-110'
                      : 'text-muted-foreground/60 group-hover:text-destructive',
                  )}
                />
              </div>
            </button>
          </div>
          <div className="flex items-center mb-1.5">
            <div className="flex items-center gap-1 dark:bg-white/5 backdrop-blur-sm px-1.5 py-0.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-foreground">{product.rating}</span>
              <span className="text-xs text-muted-foreground font-medium">
                ({product.reviewCount})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Store className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{product.shopName}</span>
          </div>
        </div>
      </Link>

      {/* Price */}
      <div className="px-4 pb-4 mt-auto">
        <div className="flex items-end justify-between mb-3 leading-none">
          <div>
            <span className="text-base font-bold text-foreground">
              {product.price.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {quantity > 0 ? (
            <motion.div
              key="counter"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between w-full rounded-xl bg-muted px-1 h-10"
            >
              <button
                onClick={onDecrement}
                className="w-8 h-8 rounded-lg hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-foreground tabular-nums">{quantity}</span>
              <button
                onClick={onIncrement}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="add"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <ShimmerButton
                onClick={onAdd}
                disabled={!product.isAvailable}
                className="w-full h-10 text-sm font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {product.isAvailable ? 'В корзину' : 'Нет в наличии'}
              </ShimmerButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}
