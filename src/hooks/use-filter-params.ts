import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ProductFilter } from '@/lib/catalog'
import type { ProductSortBy } from '@/api/catalog'

/**
 * Reads ProductFilter from URL search params.
 * isInStock defaults to true when the param is absent (default UX: show in-stock only).
 * inStock=false means user explicitly wants to see all products.
 */
export function filterFromParams(params: URLSearchParams): ProductFilter {
  const raw = params.get('inStock')
  return {
    sort: (params.get('sort') as ProductSortBy) || undefined,
    minPrice: params.get('min') ? Number(params.get('min')) : undefined,
    maxPrice: params.get('max') ? Number(params.get('max')) : undefined,
    isInStock: raw === 'false' ? undefined : true,
  }
}

/** Writes ProductFilter back to URLSearchParams (mutates a copy). */
export function filterToParams(filter: ProductFilter, base: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(base)
  if (filter.sort) next.set('sort', filter.sort)
  else next.delete('sort')
  if (filter.minPrice !== undefined) next.set('min', String(filter.minPrice))
  else next.delete('min')
  if (filter.maxPrice !== undefined) next.set('max', String(filter.maxPrice))
  else next.delete('max')
  // isInStock: true is the default → no param; undefined means "show all" → inStock=false
  if (filter.isInStock !== true) next.set('inStock', 'false')
  else next.delete('inStock')
  return next
}

/**
 * Hook that syncs ProductFilter with URL search params.
 * Uses replace:true so filter changes don't pollute the browser history —
 * the back button goes to the previous page, not the previous filter state.
 */
export function useFilterParams(): [ProductFilter, (filter: ProductFilter) => void] {
  const [params, setParams] = useSearchParams()
  const filter = filterFromParams(params)

  const setFilter = useCallback(
    (next: ProductFilter) => {
      setParams((prev) => filterToParams(next, prev), { replace: true })
    },
    [setParams],
  )

  return [filter, setFilter]
}
