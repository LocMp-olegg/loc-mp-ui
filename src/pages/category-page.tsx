import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCatalogCategory } from '@/hooks/use-catalog-category'
import { ProductFiltersBar } from '@/components/catalog/product-filters-bar'
import { ProductCard } from '@/components/product/product-card'
import { pluralize } from '@/lib/utils'
import { useFilterParams } from '@/hooks/use-filter-params'
import { useScrollRestore } from '@/hooks/use-scroll-restore'

function CategoryContent({ id }: { id: string }) {
  const [filter, setFilter] = useFilterParams()
  const { data, loading, error, hasNextPage, loadMore } = useCatalogCategory(id, filter)

  useScrollRestore(!!data && !loading)

  const handleFilterReset = () => setFilter({ sort: filter.sort, isInStock: true })

  if (!data && loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Загружаем категорию...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Категория не найдена</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">
          На главную
        </Link>
      </div>
    )
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

      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{data.emoji}</span>
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{data.name}</h1>
          {!loading && (
            <span className="text-sm text-muted-foreground shrink-0">
              {data.products.length}
              {hasNextPage ? '+' : ''}{' '}
              {pluralize(data.products.length, 'товар', 'товара', 'товаров')}
            </span>
          )}
        </div>
        <ProductFiltersBar filter={filter} onChange={setFilter} onReset={handleFilterReset} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-full" />
        ))}
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse" style={{ height: 340 }} />
          ))}
      </div>

      {!loading && !data.products.length && (
        <div className="py-20 text-center text-muted-foreground text-sm">
          Нет товаров по выбранным фильтрам
        </div>
      )}

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
      {loading && data.products.length > 0 && (
        <div className="flex justify-center mt-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  return <CategoryContent key={id} id={id ?? ''} />
}
