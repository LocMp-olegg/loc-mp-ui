import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/layout/layout'
import { HomePage } from '@/pages/home-page'
import { CartPage } from '@/pages/cart-page'
import { FavoritesPage } from '@/pages/favorites-page'
import { ProductPage } from '@/pages/product-page'
import { CategoryPage } from '@/pages/category-page'
import { LoginPage } from '@/pages/login-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'product/:id', element: <ProductPage /> },
      { path: 'category/:id', element: <CategoryPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
])
