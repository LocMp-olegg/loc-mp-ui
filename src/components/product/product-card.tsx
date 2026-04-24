import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Minus, Plus, ShoppingCart, Star, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductImageSlider } from './product-image-slider'
import { useCart } from '@/contexts/cart-context'
import { useFavorites } from '@/contexts/favorites-context'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'
import { useState } from 'react'

interface Props {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: Props) {
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const { addToCart, updateQuantity, items } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()

  const favorite = isFavorite(product.id)
  const cartItem = items.find((item) => item.product.id === product.id)
  const quantity = cartItem?.quantity ?? 0

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const handleAddToCart = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.isAvailable) return
    addToCart(product)
  }

  const handleDecrement = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, quantity - 1)
  }

  const handleIncrement = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, quantity + 1)
  }

  const handleToggleFavorite = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  return (
    <motion.article
      className={cn(
        'relative flex flex-col bg-card rounded-2xl border border-border overflow-hidden select-none',
        className ?? 'w-56 flex-shrink-0',
      )}
      onMouseMove={handleMouseMove}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Aceternity spotlight */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s',
          background: `radial-gradient(260px at ${spotlightPos.x}px ${spotlightPos.y}px, var(--spotlight), transparent 70%)`,
        }}
      />

      {/* Favorite button */}
      <button
        onClick={handleToggleFavorite}
        aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
        className={cn(
          'absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer',
          favorite
            ? 'bg-destructive text-destructive-foreground shadow-md scale-110'
            : 'bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-card shadow-sm',
        )}
      >
        <Heart className={cn('w-3.5 h-3.5', favorite && 'fill-current')} />
      </button>

      {/* Clickable image + info area */}
      <Link to={`/product/${product.id}`} className="block flex-1">
        <ProductImageSlider images={product.images} alt={product.name} />

        <div className="px-3 pt-3 pb-2">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1.5 min-h-[2.5rem]">
            {product.name}
          </p>

          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1">
            <Store className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{product.shopName}</span>
          </div>
        </div>
      </Link>

      {/* Price */}
      <div className="px-3 pb-2 leading-none">
        <span className="text-base font-bold text-foreground">
          {product.price.toLocaleString('ru-RU')} ₽
        </span>
        <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>
      </div>

      {/* Cart controls — full width */}
      <div className="px-3 pb-3">
        <AnimatePresence mode="wait" initial={false}>
          {quantity > 0 ? (
            <motion.div
              key="counter"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between w-full rounded-xl bg-muted px-1 h-9"
            >
              <button
                onClick={handleDecrement}
                aria-label="Уменьшить количество"
                className="w-7 h-7 rounded-lg hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-semibold text-foreground tabular-nums">{quantity}</span>
              <button
                onClick={handleIncrement}
                aria-label="Увеличить количество"
                className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
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
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                aria-label="Добавить в корзину"
                className="w-full h-9 text-xs font-semibold"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {product.isAvailable ? 'В корзину' : 'Нет в наличии'}
              </ShimmerButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}
