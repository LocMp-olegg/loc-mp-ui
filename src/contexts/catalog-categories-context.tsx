import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { fetchCatalogStructure } from '@/lib/catalog'

interface CategoryInfo {
  name: string
  emoji: string
}

interface CatalogCategoriesContextValue {
  getCategoryInfo: (id: string) => CategoryInfo | null
}

const CatalogCategoriesContext = createContext<CatalogCategoriesContextValue>({
  getCategoryInfo: () => null,
})

export function CatalogCategoriesProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, CategoryInfo>>(new Map())

  useEffect(() => {
    let cancelled = false
    fetchCatalogStructure()
      .then((structure) => {
        if (cancelled) return
        const m = new Map<string, CategoryInfo>()
        for (const c of structure.leafCategories) m.set(c.id, { name: c.name, emoji: c.emoji })
        for (const c of structure.rootCategories) {
          if (!m.has(c.id)) m.set(c.id, { name: c.name, emoji: c.emoji })
        }
        setMap(m)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CatalogCategoriesContext.Provider value={{ getCategoryInfo: (id) => map.get(id) ?? null }}>
      {children}
    </CatalogCategoriesContext.Provider>
  )
}

export function useCatalogCategories() {
  return useContext(CatalogCategoriesContext)
}
