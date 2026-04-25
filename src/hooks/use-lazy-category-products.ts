import { useState, useEffect, useRef } from 'react'
import { fetchCategoryProducts } from '@/lib/catalog'
import type { Product } from '@/types/product'
import * as React from "react";

interface State {
  products: Product[]
  loading: boolean
}

export function useLazyCategoryProducts(
  categoryId: string,
): State & { ref: React.RefObject<HTMLElement | null> } {
  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<State>({ products: [], loading: true })

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

  return { ...state, ref }
}
