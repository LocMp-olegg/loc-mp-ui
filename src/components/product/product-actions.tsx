import { PackageCheck, PackageX } from 'lucide-react'
import { FavoriteButton } from './favorite-button'
import { CartControls } from './cart-controls'
import { RatingBadge } from './rating-badge'
import { useProductActions } from '@/hooks/use-product-actions'
import type { ProductDetail } from '@/types/product-detail'

interface Props {
  product: ProductDetail
}

export function ProductActions({ product }: Props) {
  const { quantity, isFavorite, onAdd, onDecrement, onIncrement, onToggleFavorite } =
    useProductActions(product)

  const maxQuantity = product.isMadeToOrder ? undefined : product.stockQuantity

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5">
      {/* Rating */}
      {product.reviewCount > 0 && (
        <div>
          <RatingBadge rating={product.rating} reviewCount={product.reviewCount} />
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground">
          {product.price.toLocaleString('ru-RU')} ₽
        </span>
        <span className="text-sm text-muted-foreground">/ {product.unit}</span>
      </div>

      {/* Stock status */}
      <div className="flex items-center gap-2 text-sm">
        {product.isAvailable ? (
          <>
            <PackageCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground">
              {product.isMadeToOrder
                ? 'Под заказ'
                : `В наличии: ${product.stockQuantity} ${product.unit}`}
            </span>
          </>
        ) : (
          <>
            <PackageX className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Нет в наличии</span>
          </>
        )}
      </div>

      {/* Cart + Favorite */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <CartControls
            quantity={quantity}
            isAvailable={product.isAvailable}
            maxQuantity={maxQuantity}
            onAdd={onAdd}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        </div>
        <FavoriteButton isFavorite={isFavorite} onClick={onToggleFavorite} />
      </div>
    </div>
  )
}
