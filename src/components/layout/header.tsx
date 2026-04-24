import { Heart, ShoppingCart, MapPin, Search, User, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/cart-context'
import { useFavorites } from '@/contexts/favorites-context'

export function Header() {
  const { totalItems } = useCart()
  const { totalFavorites } = useFavorites()

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 mr-1">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold leading-none">Р</span>
          </div>
          <span className="font-bold text-zinc-900 text-[17px] hidden sm:block tracking-tight">
            Районный
          </span>
        </Link>

        {/* Location pill */}
        <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-600 hover:border-violet-300 hover:text-violet-600 transition-colors flex-shrink-0 cursor-pointer">
          <MapPin className="w-3.5 h-3.5 text-violet-500" />
          <span>Хамовники</span>
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск товаров и магазинов..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-zinc-100 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-violet-500/25 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 ml-auto">
          <Link
            to="/favorites"
            aria-label="Избранное"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-100 transition-colors"
          >
            <Heart className="w-5 h-5 text-zinc-600" />
            {totalFavorites > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {totalFavorites > 9 ? '9+' : totalFavorites}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label="Корзина"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-100 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-zinc-600" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          <Link
            to="/profile"
            aria-label="Профиль"
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-100 transition-colors"
          >
            <User className="w-5 h-5 text-zinc-600" />
          </Link>

          <button
            aria-label="Меню"
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 text-zinc-600" />
          </button>
        </div>
      </div>
    </header>
  )
}
