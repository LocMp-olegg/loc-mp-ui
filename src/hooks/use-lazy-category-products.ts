import { useState, useEffect, useRef } from 'react'
import { fetchCategoryProducts } from '@/lib/catalog'
import { useDelayedLoading } from '@/hooks/use-delayed-loading'
import type { Product } from '@/types/product'

interface State {
  products: Product[]
  loading: boolean
}

export function useLazyCategoryProducts(
  categoryId: string,
): State & { ref: React.RefObject<HTMLElement | null> } {
  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<State>({ products: [], loading: true })

  // Only show skeleton after 300ms — prevents flash on fast connections
  const showSkeleton = useDelayedLoading(state.loading)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        fetchCategoryProducts(categoryId)
          .then((products) => setState({ products, loading: false }))
          .catch(() => setState({ products: [], loading: false }))
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [categoryId])

  return { products: state.products, loading: showSkeleton, ref }
}
