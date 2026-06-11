import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { LocationProvider } from '@/contexts/location-context'
import { CatalogCategoriesProvider } from '@/contexts/catalog-categories-context'
import { installFetchInterceptor } from '@/lib/auth'
import { router } from '@/router'
import { OpenAPI as AnalyticsOpenAPI } from '@/api/analytics/core/OpenAPI'
import { OpenAPI as CatalogOpenAPI } from '@/api/catalog/core/OpenAPI'
import { OpenAPI as ChatOpenAPI } from '@/api/chat/core/OpenAPI'
import { OpenAPI as IdentityOpenAPI } from '@/api/identity/core/OpenAPI'
import { OpenAPI as NotificationsOpenAPI } from '@/api/notifications/core/OpenAPI'
import { OpenAPI as OrdersOpenAPI } from '@/api/orders/core/OpenAPI'
import { OpenAPI as ReviewsOpenAPI } from '@/api/reviews/core/OpenAPI'
import './index.css'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
AnalyticsOpenAPI.BASE = apiBase
CatalogOpenAPI.BASE = apiBase
ChatOpenAPI.BASE = apiBase
IdentityOpenAPI.BASE = apiBase
NotificationsOpenAPI.BASE = apiBase
OrdersOpenAPI.BASE = apiBase
ReviewsOpenAPI.BASE = apiBase

installFetchInterceptor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocationProvider>
        <CatalogCategoriesProvider>
          <RouterProvider router={router} />
        </CatalogCategoriesProvider>
      </LocationProvider>
    </ThemeProvider>
  </StrictMode>,
)
