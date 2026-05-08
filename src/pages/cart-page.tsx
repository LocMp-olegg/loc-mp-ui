import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Loader2, Minus, Plus, ShoppingCart, Store, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/cart-context'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { UndoToast } from '@/components/ui/undo-toast'
import { CheckoutModal, type CheckoutGroup } from '@/components/orders/checkout-modal'
import { ProductsService } from '@/api/catalog'
import type { CartGroupDto, CartItemDto } from '@/api/orders'
import type { ProductDto } from '@/api/catalog'
import noImageUrl from '@/assets/no-image-available.jpg'

type ProductInfoMap = Record<string, ProductDto>

const UNDO_DURATION = 5000

const itemVariants: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 48, transition: { duration: 0.18 } },
}

const groupVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.18 } },
}

interface PendingDelete {
  cartItemId: string
  productId: string
  productName: string
  quantity: number
  count: number
}

// ── Cart item ────────────────────────────────────────────────────────────────

function CartItem({
  item,
  productInfo,
  onRemove,
  onBuyItem,
}: {
  item: CartItemDto
  productInfo: ProductDto | undefined
  onRemove: (item: CartItemDto) => void
  onBuyItem: (item: CartItemDto) => void
}) {
  const { updateQuantity } = useCart()
  const qty = item.quantity ?? 0
  const maxQty = productInfo?.isMadeToOrder ? Infinity : (productInfo?.stockQuantity ?? Infinity)
  const atMax = qty >= maxQty

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
        <img
          src={productInfo?.mainPhotoUrl ?? noImageUrl}
          alt={item.productName ?? ''}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${item.productId}`}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
        >
          {item.productName}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
          <span>{(item.price ?? 0).toLocaleString('ru-RU')} ₽ / шт.</span>
          {productInfo && !productInfo.isMadeToOrder && (
            <span className="text-muted-foreground/55">в наличии: {productInfo.stockQuantity}</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => {
            if (!item.id) return
            void updateQuantity(item.id, qty - 1)
          }}
          disabled={qty <= 1}
          aria-label="Уменьшить"
          className="w-7 h-7 rounded-lg bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default hover:enabled:bg-muted/70"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-7 text-center text-sm font-semibold text-foreground tabular-nums">
          {qty}
        </span>
        <button
          onClick={() => {
            if (!item.id) return
            void updateQuantity(item.id, qty + 1)
          }}
          disabled={atMax}
          aria-label="Увеличить"
          className="w-7 h-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-default hover:enabled:opacity-90"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <span className="text-sm font-bold text-foreground shrink-0 min-w-14 text-right">
        {(item.subtotal ?? 0).toLocaleString('ru-RU')} ₽
      </span>

      <button
        onClick={() => onBuyItem(item)}
        aria-label="Купить только этот товар"
        title="Купить только этот товар"
        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onRemove(item)}
        aria-label="Удалить"
        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Cart group ───────────────────────────────────────────────────────────────

function CartGroup({
  group,
  productInfoMap,
  onRemove,
  onBuyItem,
  onBuyGroup,
}: {
  group: CartGroupDto
  productInfoMap: ProductInfoMap
  onRemove: (item: CartItemDto) => void
  onBuyItem: (item: CartItemDto, group: CartGroupDto) => void
  onBuyGroup: (group: CartGroupDto) => void
}) {
  const items = useMemo(
    () => [...(group.items ?? [])].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? '')),
    [group.items],
  )

  return (
    <div
      className="rounded-2xl border border-white/20 dark:border-white/8 shadow-sm overflow-hidden"
      style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
    >
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <Store className="w-4 h-4 text-muted-foreground shrink-0" />
        {group.shopId ? (
          <Link
            to={`/shop/${group.shopId}`}
            className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors"
          >
            {group.shopName ?? group.sellerName ?? 'Магазин'}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-foreground truncate">
            {group.shopName ?? group.sellerName ?? 'Магазин'}
          </span>
        )}
        <span className="ml-auto text-sm font-medium text-muted-foreground shrink-0">
          {(group.groupTotal ?? 0).toLocaleString('ru-RU')} ₽
        </span>
        <button
          onClick={() => onBuyGroup(group)}
          title="Заказать товары из этого магазина"
          className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
        >
          <ShoppingBag className="w-3 h-3" />
          Заказать
        </button>
      </div>

      <AnimatePresence initial={false}>
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={idx > 0 ? 'border-t border-border/30' : ''}
          >
            <CartItem
              item={item}
              productInfo={item.productId ? productInfoMap[item.productId] : undefined}
              onRemove={onRemove}
              onBuyItem={(item) => onBuyItem(item, group)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function cartGroupToCheckoutGroup(group: CartGroupDto, selectedItems?: CartItemDto[]): CheckoutGroup {
  const items = selectedItems ?? group.items ?? []
  return {
    sellerId: group.sellerId!,
    shopId: group.shopId,
    shopName: group.shopName,
    sellerName: group.sellerName,
    items,
    isFullGroup: !selectedItems,
  }
}

// ── Cart page ────────────────────────────────────────────────────────────────

export function CartPage() {
  const { cart, isLoading, totalItems, removeItem, addToCart, refreshCart } = useCart()
  const [productInfoMap, setProductInfoMap] = useState<ProductInfoMap>({})
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [checkoutGroups, setCheckoutGroups] = useState<CheckoutGroup[] | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deleteCountRef = useRef(0)

  const groups = useMemo(
    () =>
      [...(cart?.groups ?? [])].sort((a, b) =>
        (a.shopId ?? a.sellerId ?? '').localeCompare(b.shopId ?? b.sellerId ?? ''),
      ),
    [cart?.groups],
  )

  const productIdsKey = useMemo(
    () =>
      [
        ...new Set(
          groups.flatMap((g) => (g.items ?? []).flatMap((i) => (i.productId ? [i.productId] : []))),
        ),
      ]
        .sort()
        .join(','),
    [groups],
  )

  useEffect(() => {
    if (!productIdsKey) return
    const ids = productIdsKey.split(',')
    Promise.all(
      ids.map((id) =>
        ProductsService.getApiCatalogProducts({ id })
          .then((p) => [id, p] as const)
          .catch(() => null),
      ),
    ).then((results) => {
      const map: ProductInfoMap = {}
      for (const r of results) if (r) map[r[0]] = r[1]
      setProductInfoMap(map)
    })
  }, [productIdsKey])

  const handleRemove = useCallback(
    (item: CartItemDto) => {
      if (!item.id || !item.productId) return

      if (timerRef.current) clearTimeout(timerRef.current)
      if (pendingDelete) void removeItem(pendingDelete.cartItemId)

      void removeItem(item.id)

      deleteCountRef.current += 1
      setPendingDelete({
        cartItemId: item.id,
        productId: item.productId,
        productName: item.productName ?? 'Товар',
        quantity: item.quantity ?? 1,
        count: deleteCountRef.current,
      })

      timerRef.current = setTimeout(() => {
        setPendingDelete(null)
        timerRef.current = null
      }, UNDO_DURATION)
    },
    [pendingDelete, removeItem],
  )

  const handleUndo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (pendingDelete) void addToCart(pendingDelete.productId, pendingDelete.quantity)
    setPendingDelete(null)
  }, [pendingDelete, addToCart])

  const handleBuyItem = useCallback((item: CartItemDto, group: CartGroupDto) => {
    setCheckoutGroups([cartGroupToCheckoutGroup(group, [item])])
  }, [])

  const handleBuyGroup = useCallback((group: CartGroupDto) => {
    setCheckoutGroups([cartGroupToCheckoutGroup(group)])
  }, [])

  const handleBuyAll = useCallback(() => {
    setCheckoutGroups(groups.map((g) => cartGroupToCheckoutGroup(g)))
  }, [groups])

  const handleCheckoutSuccess = useCallback(() => {
    setCheckoutGroups(null)
    void refreshCart()
  }, [refreshCart])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Корзина пуста</h1>
        <p className="text-muted-foreground text-sm">Добавьте товары из каталога</p>
        <Link to="/">
          <ShimmerButton className="px-5 py-2.5 text-sm font-semibold">На главную</ShimmerButton>
        </Link>
        <UndoToast
          show={!!pendingDelete}
          message={`Удалено: ${pendingDelete?.productName ?? ''}`}
          onUndo={handleUndo}
          toastKey={pendingDelete?.count}
          duration={UNDO_DURATION}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-5">
        Корзина{' '}
        <span className="text-muted-foreground font-normal text-base md:text-lg">
          ({totalItems})
        </span>
      </h1>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {groups.map((group) => (
            <motion.div
              key={group.shopId ?? group.sellerId}
              variants={groupVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              layout
            >
              <CartGroup
                group={group}
                productInfoMap={productInfoMap}
                onRemove={handleRemove}
                onBuyItem={handleBuyItem}
                onBuyGroup={handleBuyGroup}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {groups.length > 1 && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Товары от разных продавцов будут оформлены отдельными заказами
        </p>
      )}

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Итого</p>
          <p className="text-lg font-bold text-foreground">
            {(cart?.totalAmount ?? 0).toLocaleString('ru-RU')} ₽
          </p>
        </div>
        <ShimmerButton
          onClick={handleBuyAll}
          className="px-5 py-2.5 text-sm font-semibold cursor-pointer"
        >
          Оформить заказ
        </ShimmerButton>
      </div>

      <UndoToast
        show={!!pendingDelete}
        message={`Удалено: ${pendingDelete?.productName ?? ''}`}
        onUndo={handleUndo}
        toastKey={pendingDelete?.count}
        duration={UNDO_DURATION}
      />

      <AnimatePresence>
        {checkoutGroups && (
          <CheckoutModal
            groups={checkoutGroups}
            productInfoMap={productInfoMap}
            onClose={() => setCheckoutGroups(null)}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
