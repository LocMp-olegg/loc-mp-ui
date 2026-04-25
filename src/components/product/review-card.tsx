import { MessageSquare } from 'lucide-react'
import { StarRating } from '@/components/ui/star-rating'
import type { ReviewItem } from '@/types/product-detail'

interface Props {
  review: ReviewItem
}

function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ReviewCard({ review }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{review.reviewerName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(review.createdAt)}</p>
        </div>
        <div className="shrink-0">
          <StarRating rating={review.rating} size={14} />
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
      )}

      {/* Photos */}
      {review.photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.photos.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className="w-16 h-16 rounded-xl object-cover border border-border"
            />
          ))}
        </div>
      )}

      {/* Seller response */}
      {review.response && (
        <div className="rounded-xl bg-muted/60 border border-border p-3 flex gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-muted-foreground">Ответ продавца</p>
            <p className="text-sm text-foreground">{review.response.comment}</p>
          </div>
        </div>
      )}
    </div>
  )
}
