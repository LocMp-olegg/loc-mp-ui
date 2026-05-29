import { useState, useEffect } from 'react'
import { Star, Loader2, AlertCircle } from 'lucide-react'
import { useCourierProfile } from '@/hooks/use-courier-profile'
import { useCourierReviews } from '@/hooks/use-courier-reviews'
import { fetchCourierRating } from '@/lib/reviews'
import { ProductReviews } from '@/components/product/product-reviews'
import type { RatingAggregateDto } from '@/api/reviews'

export function CourierReviewsPage() {
  const { profile, loading: profileLoading } = useCourierProfile()
  const courierId = profile?.courierId

  const [aggregate, setAggregate] = useState<RatingAggregateDto | null>(null)

  const {
    reviews,
    hasNextPage,
    loading,
    sort,
    filterStar,
    setSort,
    setFilterStar,
    loadMore,
    reset,
  } = useCourierReviews(courierId)

  useEffect(() => {
    if (!courierId) return
    let cancelled = false
    fetchCourierRating(courierId)
      .then((data) => {
        if (!cancelled) setAggregate(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [courierId])

  if (profileLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!courierId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Профиль курьера недоступен</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-2 mb-5">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Мои отзывы</h1>
      </div>

      <ProductReviews
        reviews={reviews}
        aggregate={aggregate}
        sort={sort}
        filterStar={filterStar}
        hasNextPage={hasNextPage}
        loading={loading}
        setSort={setSort}
        setFilterStar={setFilterStar}
        loadMore={loadMore}
        reset={reset}
      />
    </div>
  )
}
