import { useEffect, useReducer, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { PackageSearch, ArrowLeft, Loader2 } from 'lucide-react'
import { fetchSearchResults } from '@/lib/catalog'
import { ProductCard } from '@/components/product/product-card'
import type { Product } from '@/types/product'
import { pluralize } from '@/lib/utils'

const SKELETON_COUNT = 10

interface State {
  products: Product[]
  loading: boolean
  fetched: boolean
  hasNextPage: boolean
}

type Action =
  | { type: 'loading' }
  | { type: 'loaded'; products: Product[]; hasNextPage: boolean; append: boolean }
  | { type: 'empty' }
  | { type: 'error' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true }
    case 'loaded':
      return {
        products: action.append ? [...state.products, ...action.products] : action.products,
        loading: false,
        fetched: true,
        hasNextPage: action.hasNextPage,
      }
    case 'empty':
    case 'error':
      return { products: [], loading: false, fetched: true, hasNextPage: false }
  }
}

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [{ products, loading, fetched, hasNextPage }, dispatch] = useReducer(reducer, {
    products: [],
    loading: false,
    fetched: false,
    hasNextPage: false,
  })

  const pageRef = useRef(1)

  // Reset and fetch page 1 when query changes
  useEffect(() => {
    pageRef.current = 1

    if (!query.trim()) {
      dispatch({ type: 'empty' })
      return
    }

    let cancelled = false
    dispatch({ type: 'loading' })

    fetchSearchResults(query.trim(), 1)
      .then((data) => {
        if (!cancelled)
          dispatch({
            type: 'loaded',
            products: data.products,
            hasNextPage: data.hasNextPage,
            append: false,
          })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [query])

  const loadMore = () => {
    pageRef.current++
    dispatch({ type: 'loading' })
    fetchSearchResults(query.trim(), pageRef.current)
      .then((data) =>
        dispatch({
          type: 'loaded',
          products: data.products,
          hasNextPage: data.hasNextPage,
          append: true,
        }),
      )
      .catch(() => dispatch({ type: 'error' }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground break-all">
          {query ? (
            <>
              Результаты по <span className="text-primary">«{query}»</span>
            </>
          ) : (
            'Поиск'
          )}
        </h1>
        {fetched && !loading && products.length > 0 && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} {pluralize(products.length, 'товар', 'товара', 'товаров')}
          </p>
        )}
      </div>

      {/* Initial loading skeletons */}
      {loading && products.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse" style={{ height: 340 }} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} className="w-full" />
          ))}
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse" style={{ height: 340 }} />
            ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
          >
            Показать ещё
          </button>
        </div>
      )}
      {loading && products.length > 0 && (
        <div className="flex justify-center mt-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && fetched && products.length === 0 && query && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-4xl">
              🔍
            </div>
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center">
              <PackageSearch className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Ничего не нашли</h3>
          <p className="text-muted-foreground text-sm max-w-xs break-all">
            По запросу <span className="text-foreground font-medium">«{query}»</span> товаров не
            найдено. Попробуйте другое слово или измените запрос.
          </p>
          <Link
            to="/"
            className="mt-6 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            На главную
          </Link>
        </div>
      )}
    </div>
  )
}
