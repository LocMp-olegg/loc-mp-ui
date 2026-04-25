import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { CartProvider } from '@/contexts/cart-context'
import { FavoritesProvider } from '@/contexts/favorites-context'
import { router } from '@/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FavoritesProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </FavoritesProvider>
    </ThemeProvider>
  </StrictMode>,
)
