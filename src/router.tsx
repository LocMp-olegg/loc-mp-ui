import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/layout'
import { HomePage } from '@/pages/home-page'
import { CartPage } from '@/pages/cart-page'
import { FavoritesPage } from '@/pages/favorites-page'
import { ProductPage } from '@/pages/product-page'
import { CategoryPage } from '@/pages/category-page'
import { LoginPage } from '@/pages/login-page'
import { SearchPage } from '@/pages/search-page'
import { ShopPage } from '@/pages/shop-page'
import { SellerPage } from '@/pages/seller-page'
import { RequireAuth } from '@/components/auth/require-auth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'product/:id', element: <ProductPage /> },
      { path: 'category/:id', element: <CategoryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'shop/:id', element: <ShopPage /> },
      { path: 'seller/:id', element: <SellerPage /> },
      {
        path: 'cart',
        element: (
          <RequireAuth>
            <CartPage />
          </RequireAuth>
        ),
      },
      {
        path: 'favorites',
        element: (
          <RequireAuth>
            <FavoritesPage />
          </RequireAuth>
        ),
      },
      { path: 'login', element: <LoginPage /> },
    ],
  },
])
