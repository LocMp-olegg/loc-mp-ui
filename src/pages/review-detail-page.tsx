import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Star } from 'lucide-react'
import { ReviewsService } from '@/api/reviews'
import type { ReviewDto } from '@/api/reviews'
import type { SellerDto } from '@/api/catalog'
import { SellersService } from '@/api/catalog'
import { ReviewCard } from '@/components/product/review-card'
import { useAuth } from '@/contexts/auth-context'
import { fetchProductDetail } from '@/lib/catalog'
import { pluralize } from '@/lib/utils'
import type { ProductDetail, ReviewItem } from '@/types/product-detail'
import noImageUrl from '@/assets/no-image-available.jpg'

function mapDto(dto: ReviewDto): ReviewItem {
  return {
    id: dto.id ?? '',
    reviewerName: dto.reviewerName ?? 'Аноним',
    rating: dto.rating ?? 0,
    comment: dto.comment ?? null,
    createdAt: dto.createdAt ?? '',
    photos: (dto.photos ?? []).map((p) => p.storageUrl ?? '').filter(Boolean),
    response: dto.response
      ? {
          id: dto.response.id ?? '',
          comment: dto.response.comment ?? '',
          createdAt: dto.response.createdAt ?? '',
          authorId: dto.response.authorId ?? '',
        }
      : null,
  }
}

type SubjectInfo = { type: 'Product'; data: ProductDetail } | { type: 'Seller'; data: SellerDto }

function SubjectCard({ subject }: { subject: SubjectInfo }) {
  const link =
    subject.type === 'Product' ? `/product/${subject.data.id}` : `/sellers/${subject.data.id}`

  return (
    <Link
      to={link}
      className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card/50 hover:opacity-90 transition-opacity mb-5"
    >
      {subject.type === 'Product' ? (
        <img
          src={subject.data.images[0] ?? noImageUrl}
          alt={subject.data.name}
          className="w-14 h-14 rounded-xl object-cover bg-muted shrink-0"
        />
      ) : (
        <img
          src={subject.data.avatarUrl ?? noImageUrl}
          alt={subject.data.displayName ?? ''}
          className="w-12 h-12 rounded-xl object-cover bg-muted shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        {subject.type === 'Product' ? (
          <>
            <p className="text-sm font-semibold text-foreground line-clamp-1">
              {subject.data.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subject.data.shopName}
              {subject.data.price != null && <> · {subject.data.price.toLocaleString('ru-RU')} ₽</>}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground line-clamp-1">
              {subject.data.displayName ?? 'Продавец'}
            </p>
            {(subject.data.reviewCount ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {(subject.data.averageRating ?? 0).toFixed(1)}
                {' · '}
                {subject.data.reviewCount}{' '}
                {pluralize(subject.data.reviewCount ?? 0, 'отзыв', 'отзыва', 'отзывов')}
              </p>
            )}
          </>
        )}
      </div>

      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  )
}

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [dto, setDto] = useState<ReviewDto | null>(null)
  const [subject, setSubject] = useState<SubjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canRespond, setCanRespond] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await ReviewsService.getApiReviewsReviews1({ id })
        if (cancelled) return
        setDto(data)
        setLoading(false)

        if (data.subjectType === 'Product' && data.subjectId) {
          try {
            const product = await fetchProductDetail(data.subjectId)
            if (!cancelled) {
              setSubject({ type: 'Product', data: product })
              setCanRespond(!!user && product.sellerId === user.id)
            }
          } catch {
            // не критично
          }
        } else if (data.subjectType === 'Seller' && data.subjectId) {
          setCanRespond(!!user && data.subjectId === user.id)
          try {
            const seller = await SellersService.getApiCatalogSellers({ id: data.subjectId })
            if (!cancelled) setSubject({ type: 'Seller', data: seller })
          } catch {
            // не критично
          }
        }
      } catch {
        if (!cancelled) {
          setError('Отзыв не найден')
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, user])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !dto) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-3">{error ?? 'Отзыв не найден'}</p>
        <Link to="/" className="text-primary text-sm hover:underline">
          На главную
        </Link>
      </div>
    )
  }

  const review = mapDto(dto)

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      <Link
        to={-1 as unknown as string}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>

      <h1 className="text-xl font-bold text-foreground mb-4">Отзыв</h1>

      {subject && <SubjectCard subject={subject} />}

      <ReviewCard review={review} canRespond={canRespond} currentUserId={user?.id} />
    </div>
  )
}
