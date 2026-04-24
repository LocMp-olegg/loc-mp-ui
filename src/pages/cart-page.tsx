import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/cart-context'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'

export function CartPage() {
  const { items, totalItems, updateQuantity } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Корзина пуста</h1>
        <p className="text-muted-foreground text-sm">Добавьте товары из каталога</p>
        <Link to="/">
          <ShimmerButton className="px-5 py-2.5 text-sm font-semibold">На главную</ShimmerButton>
        </Link>
      </div>
    )
  }

  const total = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-5">
        Корзина{' '}
        <span className="text-muted-foreground font-normal text-base md:text-lg">
          ({totalItems})
        </span>
      </h1>

      <div className="space-y-3">
        {items.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="flex gap-3 bg-card rounded-2xl p-3 border border-border shadow-sm"
          >
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-16 h-16 rounded-xl object-cover bg-muted shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.shopName}</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    aria-label="Уменьшить"
                    className="w-7 h-7 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    aria-label="Увеличить"
                    className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {/* Price */}
                <p className="text-sm font-bold text-foreground shrink-0">
                  {(product.price * quantity).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">
          Итого: {total.toLocaleString('ru-RU')} ₽
        </span>
        <ShimmerButton className="px-5 py-2.5 text-sm font-semibold">Оформить</ShimmerButton>
      </div>
    </div>
  )
}
