import { createContext, useContext, useMemo, useReducer, useEffect, type ReactNode } from 'react'
import type { FavoriteDto } from '@/api/catalog'
import { FavoritesService } from '@/api/catalog'
import { useAuth } from '@/contexts/auth-context'

type FavAction =
  | { type: 'clear' }
  | { type: 'loaded'; items: FavoriteDto[] }
  | { type: 'add'; item: FavoriteDto }
  | { type: 'remove'; productId: string }
  | { type: 'reload'; items: FavoriteDto[] }

function favReducer(state: FavoriteDto[], action: FavAction): FavoriteDto[] {
  switch (action.type) {
    case 'clear':
      return []
    case 'loaded':
      return action.items
    case 'add':
      return [action.item, ...state]
    case 'remove':
      return state.filter((f) => f.productId !== action.productId)
    case 'reload':
      return action.items
  }
}

interface FavoritesContextType {
  favoriteItems: FavoriteDto[]
  favoriteIds: Set<string>
  isLoading: boolean
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
  totalFavorites: number
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth()
  const [favoriteItems, dispatch] = useReducer(favReducer, [])
  const [isLoading, setIsLoading] = useReducer((_: boolean, next: boolean) => next, false)

  useEffect(() => {
    if (initializing) return
    if (!isAuthenticated) {
      dispatch({ type: 'clear' })
      return
    }
    let cancelled = false
    setIsLoading(true)

    const loadAll = async () => {
      const first = await FavoritesService.getApiCatalogFavorites({ page: 1, pageSize: 100 })
      if (cancelled) return
      let items = first.items ?? []
      if (first.hasNextPage) {
        const totalPages = first.totalPages ?? 1
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            FavoritesService.getApiCatalogFavorites({ page: i + 2, pageSize: 100 }),
          ),
        )
        if (cancelled) return
        items = [...items, ...rest.flatMap((r) => r.items ?? [])]
      }
      dispatch({ type: 'loaded', items })
    }

    loadAll()
      .catch(() => {
        if (!cancelled) dispatch({ type: 'clear' })
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, initializing])

  const favoriteIds = useMemo(
    () => new Set<string>(favoriteItems.flatMap((f) => (f.productId ? [f.productId] : []))),
    [favoriteItems],
  )

  const isFavorite = (productId: string): boolean => favoriteIds.has(productId)

  const toggleFavorite = (productId: string): void => {
    if (favoriteIds.has(productId)) {
      dispatch({ type: 'remove', productId })
      FavoritesService.deleteApiCatalogFavorites({ productId }).catch(() => {
        FavoritesService.getApiCatalogFavorites({ page: 1, pageSize: 100 })
          .then((r) => dispatch({ type: 'reload', items: r.items ?? [] }))
          .catch(() => {})
      })
    } else {
      dispatch({ type: 'add', item: { productId, createdAt: new Date().toISOString() } })
      FavoritesService.postApiCatalogFavorites({ productId }).catch(() => {
        dispatch({ type: 'remove', productId })
      })
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favoriteItems,
        favoriteIds,
        isLoading,
        toggleFavorite,
        isFavorite,
        totalFavorites: favoriteItems.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
