import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Tag,
  Image,
  Check,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProductById } from '@/hooks/use-my-products'
import { useProductForm } from '@/hooks/use-product-form'
import { useMyShops } from '@/hooks/use-my-shops'
import { CategoryPicker } from '@/components/seller/category-picker'
import { ProductPhotosSection } from '@/components/seller/product-photos-section'
import { ProductTagsSection } from '@/components/seller/product-tags-section'
import { ProfileSelect } from '@/components/ui/profile-select'
import { cn } from '@/lib/utils'

const inputCls = (err?: string) =>
  cn(
    'w-full h-10 px-3 text-sm text-foreground bg-background border rounded-xl outline-none focus:ring-2 transition-all placeholder:text-muted-foreground/50',
    err
      ? 'border-destructive focus:ring-destructive/25 focus:border-destructive'
      : 'border-border focus:ring-primary/25 focus:border-primary/50',
  )

const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'
const sectionClass = 'rounded-2xl border border-border bg-card/60 p-5 sm:p-6'
const sectionTitle = 'text-sm font-semibold text-foreground mb-4 flex items-center gap-2'

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer"
    >
      <div
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-1'}`}
        />
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  )
}

export function ProductEditPage() {
  const { productId } = useParams<{ productId: string }>()
  const isEdit = !!productId

  const {
    product,
    setProduct,
    loading: productLoading,
    error: productError,
    reload,
  } = useProductById(productId)
  const { shops } = useMyShops()

  const {
    form,
    dispatch,
    fieldErrors,
    setFieldErrors,
    saving,
    saved,
    error,
    stockDelta,
    setStockDelta,
    stockSaving,
    stockSaved,
    stockError,
    handleSubmit,
    handleAdjustStock,
  } = useProductForm(productId, product, setProduct)

  const shopOptions = shops.map((s) => ({
    value: s.id ?? '',
    label: s.businessName ?? 'Без названия',
  }))

  // When a shop is selected on new product, copy its coordinates into the form
  useEffect(() => {
    if (isEdit || !form.shopId) return
    const shop = shops.find((s) => s.id === form.shopId)
    if (shop) {
      dispatch({
        type: 'patch',
        patch: { latitude: shop.latitude ?? null, longitude: shop.longitude ?? null },
      })
    }
  }, [form.shopId, shops, isEdit, dispatch])

  if (isEdit && productLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-6 w-36 bg-muted rounded-xl" />
        <div className="rounded-2xl border border-border bg-card/60 h-64" />
        <div className="rounded-2xl border border-border bg-card/60 h-40" />
      </div>
    )
  }

  if (isEdit && productError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-destructive">{productError}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/seller/products"
          className="w-8 h-8 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-bold text-foreground flex-1">
          {isEdit ? 'Редактирование товара' : 'Новый товар'}
        </h1>
        {isEdit && productId && (
          <Link
            to={`/product/${productId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Карточка
          </Link>
        )}
      </div>

      {/* Basic info */}
      <div className={sectionClass}>
        <p className={sectionTitle}>
          <Package className="w-4 h-4 text-muted-foreground" />
          Основное
        </p>

        <div className="space-y-4">
          {/* Shop — new only */}
          {!isEdit && (
            <div>
              <label className={labelClass}>Магазин *</label>
              <ProfileSelect
                options={shopOptions}
                value={form.shopId}
                onChange={(v) => {
                  dispatch({ type: 'patch', patch: { shopId: v } })
                  setFieldErrors((e) => ({ ...e, shopId: undefined }))
                }}
                placeholder="Выберите магазин"
              />
              {fieldErrors.shopId && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.shopId}</p>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className={labelClass}>Категория *</label>
            <CategoryPicker
              value={form.categoryId}
              onChange={(id) => {
                dispatch({ type: 'patch', patch: { categoryId: id } })
                setFieldErrors((e) => ({ ...e, categoryId: undefined }))
              }}
              error={!!fieldErrors.categoryId}
            />
            {fieldErrors.categoryId && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.categoryId}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Название *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                dispatch({ type: 'patch', patch: { name: e.target.value } })
                setFieldErrors((e2) => ({ ...e2, name: undefined }))
              }}
              placeholder="Название товара"
              maxLength={200}
              className={inputCls(fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => {
                dispatch({ type: 'patch', patch: { description: e.target.value } })
                setFieldErrors((e2) => ({ ...e2, description: undefined }))
              }}
              placeholder="Расскажите о товаре..."
              rows={4}
              className={cn(
                'w-full px-3 py-2.5 text-sm text-foreground bg-background border rounded-xl outline-none focus:ring-2 transition-all placeholder:text-muted-foreground/50 resize-none',
                fieldErrors.description
                  ? 'border-destructive focus:ring-destructive/25 focus:border-destructive'
                  : 'border-border focus:ring-primary/25 focus:border-primary/50',
              )}
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Price + Unit */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Цена, ₽ *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => {
                  dispatch({ type: 'patch', patch: { price: e.target.value } })
                  setFieldErrors((e2) => ({ ...e2, price: undefined }))
                }}
                placeholder="0.00"
                className={cn(inputCls(fieldErrors.price), 'input-no-spin')}
              />
              {fieldErrors.price && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.price}</p>
              )}
            </div>
            <div className="w-28">
              <label className={labelClass}>Единица *</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => {
                  dispatch({ type: 'patch', patch: { unit: e.target.value } })
                  setFieldErrors((e2) => ({ ...e2, unit: undefined }))
                }}
                placeholder="шт"
                maxLength={20}
                className={inputCls(fieldErrors.unit)}
              />
              {fieldErrors.unit && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.unit}</p>
              )}
            </div>
          </div>

          {/* Made to order */}
          <Toggle
            checked={form.isMadeToOrder}
            onChange={(v) => dispatch({ type: 'patch', patch: { isMadeToOrder: v } })}
            label="Под заказ"
          />

          <AnimatePresence>
            {form.isMadeToOrder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <label className={labelClass}>Срок изготовления, дней</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.leadTimeDays}
                  onChange={(e) => {
                    dispatch({ type: 'patch', patch: { leadTimeDays: e.target.value } })
                    setFieldErrors((e2) => ({ ...e2, leadTimeDays: undefined }))
                  }}
                  placeholder="7"
                  className={cn(inputCls(fieldErrors.leadTimeDays), 'input-no-spin')}
                />
                {fieldErrors.leadTimeDays && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.leadTimeDays}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active toggle — edit only */}
          {isEdit && (
            <Toggle
              checked={form.isActive}
              onChange={(v) => dispatch({ type: 'patch', patch: { isActive: v } })}
              label="Товар активен"
            />
          )}
        </div>

        {/* Save button — inside the section */}
        <div className="mt-5 pt-4 border-t border-border">
          {error && <p className="text-xs text-destructive mb-3">{error}</p>}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Stock */}
      <div className={sectionClass}>
        <p className={sectionTitle}>
          <Package className="w-4 h-4 text-muted-foreground" />
          Остаток
        </p>

        {form.isMadeToOrder ? (
          <div className="flex items-start gap-2 rounded-xl bg-muted/60 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Товар продаётся под заказ — остаток не расходуется при оформлении заказов.
              Корректировка недоступна.
            </p>
          </div>
        ) : (
          <>
            {/* Initial stock — new only */}
            {!isEdit && (
              <div>
                <label className={labelClass}>Начальный остаток *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.initialStock}
                  onChange={(e) => {
                    dispatch({ type: 'patch', patch: { initialStock: e.target.value } })
                    setFieldErrors((e2) => ({ ...e2, initialStock: undefined }))
                  }}
                  placeholder="0"
                  className={cn(inputCls(fieldErrors.initialStock), 'input-no-spin')}
                />
                {fieldErrors.initialStock && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.initialStock}</p>
                )}
              </div>
            )}

            {/* Stock adjustment — edit only */}
            {isEdit && product && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={labelClass + ' mb-0'}>Текущий остаток</span>
                  <span className="text-sm font-semibold text-foreground">
                    {product.stockQuantity ?? 0}
                  </span>
                </div>
                <label className={labelClass}>Корректировка</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="1"
                    value={stockDelta}
                    onChange={(e) => setStockDelta(e.target.value)}
                    placeholder="+10 или −5"
                    className={cn(inputCls(stockError ?? undefined), 'input-no-spin')}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void handleAdjustStock().then((ok) => {
                        if (ok) reload()
                      })
                    }
                    disabled={stockSaving || !stockDelta}
                    className="h-10 px-4 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {stockSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : stockSaved ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : null}
                    Применить
                  </button>
                </div>
                {stockError && <p className="text-xs text-destructive mt-1">{stockError}</p>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Photos — edit only */}
      {isEdit && product && (
        <div className={sectionClass}>
          <p className={sectionTitle}>
            <Image className="w-4 h-4 text-muted-foreground" />
            Фотографии
          </p>
          <ProductPhotosSection
            productId={product.id!}
            photos={product.photos ?? []}
            onReload={reload}
          />
        </div>
      )}

      {/* Tags — edit only */}
      {isEdit && product && (
        <div className={sectionClass}>
          <p className={sectionTitle}>
            <Tag className="w-4 h-4 text-muted-foreground" />
            Теги
          </p>
          <ProductTagsSection productId={product.id!} initialTags={product.tags ?? []} />
        </div>
      )}
    </div>
  )
}
