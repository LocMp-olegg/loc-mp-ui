import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFavorites } from '@/contexts/favorites-context'
import { ProductCard } from '@/components/product/product-card'
import { allProducts } from '@/data/mock-products'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'

export function FavoritesPage() {
  const { favorites } = useFavorites()

  const favoriteProducts = allProducts.filter((p) => favorites.has(p.id))

  if (favoriteProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
        <Heart className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Нет избранных товаров</h1>
        <p className="text-muted-foreground text-sm">Нажмите ♡ на карточке, чтобы добавить</p>
        <Link to="/">
          <ShimmerButton className="px-5 py-2.5 text-sm font-semibold">На главную</ShimmerButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-5">
        Избранное{' '}
        <span className="text-muted-foreground font-normal text-base md:text-lg">
          ({favoriteProducts.length})
        </span>
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {favoriteProducts.map((product) => (
          <ProductCard key={product.id} product={product} className="w-full" />
        ))}
      </div>
    </div>
  )
}
