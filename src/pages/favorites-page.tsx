import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFavorites } from '@/contexts/favorites-context'
import { ProductCard } from '@/components/product/product-card'
import { UndoToast } from '@/components/ui/undo-toast'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { ProductsService } from '@/api/catalog'
import { mapProductFromDto } from '@/lib/catalog'
import type { Product } from '@/types/product'

const PAGE_SIZE = 20
const UNDO_DURATION = 5000

interface PendingFavDelete {
  productId: string
  productName: string
  count: number
}

function ProductSkeleton() {
  return (
    <div className="rounded-3xl bg-card/20 backdrop-blur-xl border border-white/20 dark:border-white/10 overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted/50" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted/50 rounded w-3/4" />
        <div className="h-3 bg-muted/50 rounded w-1/2" />
        <div className="h-4 bg-muted/50 rounded w-1/3 mt-3" />
      </div>
    </div>
  )
}

export function FavoritesPage() {
  const { favoriteItems, favoriteIds, toggleFavorite } = useFavorites()
  const [productMap, setProductMap] = useState<Record<string, Product>>({})
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [pendingDelete, setPendingDelete] = useState<PendingFavDelete | null>(null)

  const fetchedRef = useRef(new Set<string>())
  const sentinelRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deleteCountRef = useRef(0)
  const prevIdsRef = useRef<Set<string>>(new Set())

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  useEffect(() => {
    const removed: string[] = []
    for (const id of prevIdsRef.current) {
      if (!favoriteIds.has(id)) removed.push(id)
    }
    prevIdsRef.current = new Set(favoriteIds)

    if (removed.length === 0) return

    const removedId = removed[0]
    const product = productMap[removedId]

    if (timerRef.current) clearTimeout(timerRef.current)

    deleteCountRef.current += 1
    setPendingDelete({
      productId: removedId,
      productName: product?.name ?? 'Товар',
      count: deleteCountRef.current,
    })

    timerRef.current = setTimeout(() => {
      setPendingDelete(null)
      timerRef.current = null
    }, UNDO_DURATION)
  }, [favoriteIds, productMap])

  const handleUndo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (pendingDelete) toggleFavorite(pendingDelete.productId)
    setPendingDelete(null)
  }, [pendingDelete, toggleFavorite])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const visibleFavorites = useMemo(
    () => favoriteItems.slice(0, visibleCount),
    [favoriteItems, visibleCount],
  )

  const visibleIdsKey = useMemo(
    () =>
      visibleFavorites
        .map((f) => f.productId ?? '')
        .filter(Boolean)
        .join(','),
    [visibleFavorites],
  )

  useEffect(() => {
    const toFetch = visibleIdsKey.split(',').filter((id) => id && !fetchedRef.current.has(id))

    if (toFetch.length === 0) return

    setIsLoadingProducts(true)
    toFetch.forEach((id) => fetchedRef.current.add(id))

    Promise.all(
      toFetch.map((id) =>
        ProductsService.getApiCatalogProducts({ id })
          .then((dto) => [id, mapProductFromDto(dto)] as const)
          .catch(() => null),
      ),
    )
      .then((results) => {
        setProductMap((prev) => {
          const next = { ...prev }
          for (const r of results) if (r) next[r[0]] = r[1]
          return next
        })
      })
      .finally(() => setIsLoadingProducts(false))
  }, [visibleIdsKey])

  const isEmpty = favoriteIds.size === 0
  const isInitialLoading = isLoadingProducts && Object.keys(productMap).length === 0 && !isEmpty

  if (isInitialLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
        <Heart className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Нет избранных товаров</h1>
        <p className="text-muted-foreground text-sm">Нажмите ♡ на карточке, чтобы добавить</p>
        <Link to="/">
          <ShimmerButton className="px-5 py-2.5 text-sm font-semibold">На главную</ShimmerButton>
        </Link>
        <UndoToast
          show={!!pendingDelete}
          message={`Убрано из избранного: ${pendingDelete?.productName ?? ''}`}
          onUndo={handleUndo}
          toastKey={pendingDelete?.count}
          duration={UNDO_DURATION}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-5">
        Избранное{' '}
        <span className="text-muted-foreground font-normal text-base md:text-lg">
          ({favoriteIds.size})
        </span>
      </h1>

      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleFavorites.map((fav) => {
            const product = fav.productId ? productMap[fav.productId] : undefined
            return (
              <motion.div
                key={fav.productId ?? fav.id}
                layout
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.16 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              >
                {product ? (
                  <ProductCard product={product} className="w-full" />
                ) : (
                  <ProductSkeleton />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      <div ref={sentinelRef} className="h-1 mt-4" />

      {isLoadingProducts && Object.keys(productMap).length > 0 && (
        <div className="flex justify-center mt-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
        </div>
      )}

      <UndoToast
        show={!!pendingDelete}
        message={`Убрано из избранного: ${pendingDelete?.productName ?? ''}`}
        onUndo={handleUndo}
        toastKey={pendingDelete?.count}
        duration={UNDO_DURATION}
      />
    </div>
  )
}
