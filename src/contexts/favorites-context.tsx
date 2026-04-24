import { createContext, useContext, useState, type ReactNode } from 'react'

interface FavoritesContextType {
  favorites: Set<string>
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
  totalFavorites: number
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleFavorite = (productId: string): void => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const isFavorite = (productId: string): boolean => favorites.has(productId)

  const totalFavorites = favorites.size

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, totalFavorites }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
