import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/layout'
import { SellerLayout } from '@/components/layout/seller-layout'
import { HomePage } from '@/pages/home-page'
import { CartPage } from '@/pages/cart-page'
import { FavoritesPage } from '@/pages/favorites-page'
import { ProductPage } from '@/pages/product-page'
import { CategoryPage } from '@/pages/category-page'
import { LoginPage } from '@/pages/login-page'
import { SearchPage } from '@/pages/search-page'
import { ShopPage } from '@/pages/shop-page'
import { SellerPage } from '@/pages/seller-page'
import { ProfilePage } from '@/pages/profile-page'
import { RequireAuth } from '@/components/auth/require-auth'
import { ShopsPage } from '@/pages/seller/shops-page'
import { ShopEditPage } from '@/pages/seller/shop-edit-page'
import { ProductsPage } from '@/pages/seller/products-page'
import { ProductEditPage } from '@/pages/seller/product-edit-page'
import { OrdersPage } from '@/pages/seller/orders-page'
import { AnalyticsPage } from '@/pages/seller/analytics-page'

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
      { path: 'sellers/:id', element: <SellerPage /> },
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
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/seller',
    element: <SellerLayout />,
    children: [
      { index: true, element: <Navigate to="/seller/shops" replace /> },
      { path: 'shops', element: <ShopsPage /> },
      { path: 'shops/new', element: <ShopEditPage /> },
      { path: 'shops/:shopId/edit', element: <ShopEditPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductEditPage /> },
      { path: 'products/:productId/edit', element: <ProductEditPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
    ],
  },
])
