import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, PenLine } from 'lucide-react'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductInfo } from '@/components/product/product-info'
import { ProductActions } from '@/components/product/product-actions'
import { ProductReviews } from '@/components/product/product-reviews'
import { useProductDetail } from '@/hooks/use-product-detail'
import { useProductReviews } from '@/hooks/use-product-reviews'
import { useCatalogCategories } from '@/contexts/catalog-categories-context'
import { useAuth } from '@/contexts/auth-context'
import { hasRole } from '@/lib/utils'
import { ReviewsService } from '@/api/reviews'

function ProductSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 animate-pulse">
      <div className="h-5 w-24 bg-muted rounded-full mb-6" />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl bg-muted" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-32 bg-muted rounded-full" />
          <div className="h-8 w-3/4 bg-muted rounded-xl" />
          <div className="h-4 w-1/2 bg-muted rounded-full" />
          <div className="h-24 bg-muted rounded-2xl" />
          <div className="h-32 bg-muted rounded-2xl mt-auto" />
        </div>
      </div>
    </div>
  )
}

export function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const { product, rating, loading, error } = useProductDetail(id)
  const reviewsState = useProductReviews(id)
  const { getCategoryInfo } = useCatalogCategories()
  const { user } = useAuth()

  const isOwner =
    !!user && hasRole(user.role, 'Seller') && !!product && user.id === product.sellerId

  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !id) return
    let cancelled = false
    ReviewsService.getApiReviewsReviewsAllowed({ page: 1, pageSize: 100 })
      .then((data) => {
        if (cancelled) return
        const match = (data.items ?? []).find(
          (s) => s.subjectType === 'Product' && s.subjectId === id,
        )
        setPendingOrderId(match?.orderId ?? null)
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      cancelled = true
    }
  }, [user, id])

  if (loading) return <ProductSkeleton />

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-3">{error ?? 'Товар не найден'}</p>
        <Link to="/" className="text-primary text-sm hover:underline">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      {/* Back + edit */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={-1 as unknown as string}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Link>
        {isOwner && (
          <Link
            to={`/seller/products/${product.id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm text-primary border border-primary/30 hover:border-primary/70 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Редактировать
          </Link>
        )}
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Gallery */}
        <div className="md:sticky md:top-20 md:self-start">
          <ProductGallery images={product.images} alt={product.name} />
        </div>

        {/* Info + Actions */}
        <div className="flex flex-col gap-5">
          <ProductInfo
            product={product}
            categoryName={getCategoryInfo(product.categoryId)?.name ?? null}
          />
          <ProductActions product={product} />
        </div>
      </div>

      {/* Reviews */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Отзывы</h2>
          {pendingOrderId && (
            <Link
              to={`/reviews/new?orderId=${pendingOrderId}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary border border-primary/30 hover:border-primary/70 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              Оценить товар
            </Link>
          )}
        </div>
        <ProductReviews aggregate={rating} {...reviewsState} />
      </section>
    </div>
  )
}
