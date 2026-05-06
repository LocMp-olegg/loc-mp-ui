import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductsService } from '@/api/catalog'
import type { ProductSummaryDto } from '@/api/catalog'
import { useMyProducts } from '@/hooks/use-my-products'
import { useMyShops } from '@/hooks/use-my-shops'
import { ProfileSelect } from '@/components/ui/profile-select'
import { cn } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'

const STATUS_PILLS = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'active' },
  { label: 'Неактивные', value: 'inactive' },
] as const

type StatusFilter = 'all' | 'active' | 'inactive'

function InStockToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 cursor-pointer"
    >
      <div
        className={`w-8 h-5 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-3.5' : 'left-0.5'}`}
        />
      </div>
      <span className="text-xs text-muted-foreground">Только в наличии</span>
    </button>
  )
}

export function ProductsPage() {
  const [shopFilter, setShopFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [inStock, setInStock] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active'
  const { products, loading, error, hasNextPage, totalCount, loadMore, reload } = useMyProducts({
    shopId: shopFilter || undefined,
    isActive,
    isInStock: inStock || undefined,
  })

  const { shops } = useMyShops()
  const shopOptions = [
    { value: '', label: 'Все магазины' },
    ...shops.map((s) => ({ value: s.id ?? '', label: s.businessName ?? 'Без названия' })),
  ]

  const handleToggleActive = async (summary: ProductSummaryDto) => {
    if (togglingId || !summary.id) return
    setTogglingId(summary.id)
    try {
      const full = await ProductsService.getApiCatalogProducts({ id: summary.id })
      await ProductsService.putApiCatalogProducts({
        id: summary.id,
        requestBody: {
          categoryId: full.categoryId,
          name: full.name,
          description: full.description,
          price: full.price,
          unit: full.unit,
          isActive: !full.isActive,
          isMadeToOrder: full.isMadeToOrder,
          leadTimeDays: full.leadTimeDays,
        },
      })
      reload()
    } catch {
      // no per-row error display on list
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (productId: string) => {
    setDeletingId(productId)
    try {
      await ProductsService.deleteApiCatalogProducts({ id: productId })
      setConfirmDeleteId(null)
      reload()
    } catch {
      // no per-row error display on list
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Мои товары</h1>
          {totalCount > 0 && <span className="text-sm text-muted-foreground">({totalCount})</span>}
        </div>
        <Link
          to="/seller/products/new"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <ProfileSelect
          options={shopOptions}
          value={shopFilter}
          onChange={setShopFilter}
          placeholder="Все магазины"
          className="w-48"
        />
        <div className="flex gap-1">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setStatusFilter(pill.value)}
              className={cn(
                'h-8 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                statusFilter === pill.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <InStockToggle checked={inStock} onChange={setInStock} />
      </div>

      {/* Content */}
      {loading && products.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card/60 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Товаров нет</p>
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 mt-4 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить товар
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-border bg-card/60 p-3 flex items-center gap-3"
            >
              {/* Thumbnail */}
              <Link to={`/product/${product.id}`} className="shrink-0">
                <img
                  src={product.mainPhotoUrl ?? noImageUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover bg-muted hover:opacity-85 transition-opacity"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                      product.isActive
                        ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {product.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                  {product.shopName && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {product.shopName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.price?.toFixed(2)} ₽/{product.unit ?? 'шт'} · остаток:{' '}
                  {product.stockQuantity ?? 0}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Toggle active */}
                <button
                  type="button"
                  title={product.isActive ? 'Деактивировать' : 'Активировать'}
                  onClick={() => void handleToggleActive(product)}
                  disabled={togglingId === product.id}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50',
                    product.isActive
                      ? 'bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {togglingId === product.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-green-600 dark:bg-green-400' : 'bg-muted-foreground'}`}
                    />
                  )}
                </button>

                {/* Edit */}
                <Link
                  to={`/seller/products/${product.id}/edit`}
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>

                {/* Delete */}
                <AnimatePresence mode="wait" initial={false}>
                  {confirmDeleteId === product.id ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-8 px-2 rounded-lg border border-border text-xs text-foreground hover:bg-muted transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product.id!)}
                        disabled={deletingId === product.id}
                        className="h-8 px-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap disabled:opacity-70"
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Удалить
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="trash"
                      type="button"
                      title="Удалить"
                      onClick={() => setConfirmDeleteId(product.id!)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-destructive/15 flex items-center justify-center transition-colors cursor-pointer group"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && !loading && (
        <div className="flex justify-center mt-6">
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
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      )}
    </div>
  )
}
