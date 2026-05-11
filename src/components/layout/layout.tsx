import { Outlet, useLocation } from 'react-router-dom'
import { FloatingNav } from '@/components/aceternity/floating-nav'
import { LandscapeBackground } from './landscape-background'
import { ScrollManager } from './scroll-manager'
import { AddressesProvider } from '@/contexts/addresses-context'
import { CartProvider } from '@/contexts/cart-context'
import { FavoritesProvider } from '@/contexts/favorites-context'

export function Layout() {
  const location = useLocation()
  const isLogin =
    location.pathname === '/login' || location.pathname === '/reset-password'

  return (
    <CartProvider>
      <FavoritesProvider>
        <AddressesProvider>
          <div className="min-h-screen">
            <LandscapeBackground />
            {!isLogin && <FloatingNav />}
            <main>
              <div
                className={`min-h-screen${isLogin ? '' : ' pt-14'}`}
                style={{ background: 'color-mix(in srgb, var(--background) 75%, transparent)' }}
              >
                <Outlet />
              </div>
            </main>
            <ScrollManager />
          </div>
        </AddressesProvider>
      </FavoritesProvider>
    </CartProvider>
  )
}
