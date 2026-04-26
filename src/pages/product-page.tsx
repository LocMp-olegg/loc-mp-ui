import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductInfo } from '@/components/product/product-info'
import { ProductActions } from '@/components/product/product-actions'
import { ProductReviews } from '@/components/product/product-reviews'
import { useProductDetail } from '@/hooks/use-product-detail'
import { useProductReviews } from '@/hooks/use-product-reviews'

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
      {/* Back */}
      <Link
        to={-1 as unknown as string}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>

      {/* Main grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Gallery */}
        <div className="md:sticky md:top-20 md:self-start">
          <ProductGallery images={product.images} alt={product.name} />
        </div>

        {/* Info + Actions */}
        <div className="flex flex-col gap-5">
          <ProductInfo product={product} categoryName={null} />
          <ProductActions product={product} />
        </div>
      </div>

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Отзывы</h2>
        <ProductReviews aggregate={rating} {...reviewsState} />
      </section>
    </div>
  )
}
