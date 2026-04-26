import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { StarRating } from '@/components/ui/star-rating'
import type { ReviewItem } from '@/types/product-detail'

interface Props {
  review: ReviewItem
}

function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const COLLAPSED_HEIGHT = Math.round(14 * 1.625 * 4)

const LONG_COMMENT_CHARS = 300

export function ReviewCard({ review }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isLongComment = !!review.comment && review.comment.length > LONG_COMMENT_CHARS

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
        <div className="flex flex-col items-start gap-1.5">
          <motion.div
            initial={false}
            animate={{ height: isExpanded || !isLongComment ? 'auto' : COLLAPSED_HEIGHT }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden w-full"
          >
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
              {review.comment}
            </p>
          </motion.div>

          {isLongComment && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-medium text-primary hover:underline transition-colors focus-visible:outline-none cursor-pointer"
            >
              {isExpanded ? 'Свернуть' : 'Читать полностью'}
            </button>
          )}
        </div>
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
