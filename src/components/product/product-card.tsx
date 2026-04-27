import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CartControls } from './cart-controls'
import { FavoriteButton } from './favorite-button'
import { ProductImageSlider } from './product-image-slider'
import { RatingBadge } from './rating-badge'
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
        'relative flex flex-col bg-card/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 overflow-hidden select-none w-56 shrink-0',
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
      <Link
        to={`/product/${product.id}`}
        className="absolute inset-0 z-10 rounded-3xl"
        aria-label={product.name}
      />

      <div
        className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay"
        style={{
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
          background: `radial-gradient(300px at ${spotlightPos.x}px ${spotlightPos.y}px, var(--spotlight), transparent 80%)`,
        }}
      />

      <div className="relative z-20 p-2 pb-0">
        <Link to={`/product/${product.id}`} className="block rounded-2xl overflow-hidden">
          <ProductImageSlider images={product.images} alt={product.name} />
        </Link>
      </div>

      <div className="px-4 pt-3 pb-2 flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 wrap-break-word min-h-10">
              {product.name}
            </p>

            <div className="flex items-center gap-1 mt-1">
              <Store className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{product.shopName}</span>
            </div>
          </div>

          <div className="pointer-events-auto shrink-0">
            <FavoriteButton isFavorite={isFavorite} onClick={onToggleFavorite} />
          </div>
        </div>

        <div className="mb-1.5">
          <RatingBadge rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-2 leading-none">
          <span className="text-base font-bold text-foreground">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          <span className="text-xs text-muted-foreground ml-1">/ {product.unit}</span>
        </div>
      </div>

      <div className="relative z-20 px-4 pb-4 pointer-events-none">
        <CartControls
          quantity={quantity}
          isAvailable={product.isAvailable}
          maxQuantity={product.isMadeToOrder ? undefined : product.stockQuantity}
          onAdd={onAdd}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
        />
      </div>
    </motion.article>
  )
}
