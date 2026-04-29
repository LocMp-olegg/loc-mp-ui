import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { CartProvider } from '@/contexts/cart-context'
import { FavoritesProvider } from '@/contexts/favorites-context'
import { LocationProvider } from '@/contexts/location-context'
import { installFetchInterceptor } from '@/lib/auth'
import { router } from '@/router'
import './index.css'

installFetchInterceptor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocationProvider>
        <FavoritesProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </FavoritesProvider>
      </LocationProvider>
    </ThemeProvider>
  </StrictMode>,
)
