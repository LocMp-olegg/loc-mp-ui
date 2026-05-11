import { useState } from 'react'
import { Loader2, MessageSquare, Pencil, Send, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StarRating } from '@/components/ui/star-rating'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'
import { ReviewsService } from '@/api/reviews'
import type { ReviewItem } from '@/types/product-detail'

type LocalResponse = NonNullable<ReviewItem['response']>

interface Props {
  review: ReviewItem
  canRespond?: boolean
  currentUserId?: string
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
const RESPONSE_MAX = 2000

export function ReviewCard({ review, canRespond, currentUserId }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [localResponse, setLocalResponse] = useState<LocalResponse | null>(review.response)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isLongComment = !!review.comment && review.comment.length > LONG_COMMENT_CHARS
  const isMyResponse =
    !!localResponse && !!currentUserId && localResponse.authorId === currentUserId

  const openCreate = () => {
    setDraft('')
    setFormMode('create')
  }
  const openEdit = () => {
    setDraft(localResponse?.comment ?? '')
    setFormMode('edit')
  }
  const closeForm = () => {
    setFormMode(null)
    setDraft('')
  }

  const submitResponse = async () => {
    if (!draft.trim()) return
    setSubmitting(true)
    try {
      const res =
        formMode === 'create'
          ? await ReviewsService.postApiReviewsReviewsResponse({
              id: review.id,
              requestBody: { comment: draft.trim() },
            })
          : await ReviewsService.putApiReviewsReviewsResponse({
              id: review.id,
              requestBody: { comment: draft.trim() },
            })
      setLocalResponse({
        id: res.id ?? '',
        comment: res.comment ?? '',
        createdAt: res.createdAt ?? '',
        authorId: res.authorId ?? '',
      })
      closeForm()
    } catch {
      // ignore — user can retry
    } finally {
      setSubmitting(false)
    }
  }

  const deleteResponse = async () => {
    setDeleting(true)
    try {
      await ReviewsService.deleteApiReviewsReviewsResponse({ id: review.id })
      setLocalResponse(null)
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group/card rounded-2xl border border-border bg-card/50 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{review.reviewerName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(review.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canRespond && !localResponse && formMode === null && (
            <button
              type="button"
              onClick={openCreate}
              className="opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-muted cursor-pointer"
            >
              <MessageSquare className="w-3 h-3" />
              Ответить
            </button>
          )}
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
          {review.photos.map((src, i) => (
            <button
              key={src}
              onClick={() => setLightboxIndex(i)}
              className="shrink-0 cursor-pointer rounded-xl overflow-hidden border border-border hover:opacity-80 transition-opacity"
            >
              <img src={src} alt="" className="w-16 h-16 object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={review.photos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* Existing response */}
      {localResponse && (
        <div className="group/resp rounded-xl bg-muted/60 border border-border p-3 flex gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Ответ продавца</p>
              {isMyResponse && formMode === null && (
                <div className="flex items-center gap-1 opacity-0 group-hover/resp:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={openEdit}
                    className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Редактировать ответ"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteResponse()}
                    disabled={deleting}
                    className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                    title="Удалить ответ"
                  >
                    {deleting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-foreground">{localResponse.comment}</p>
          </div>
        </div>
      )}

      {/* Response form */}
      <AnimatePresence>
        {formMode !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-primary/30 bg-background p-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {formMode === 'create' ? 'Написать ответ' : 'Редактировать ответ'}
              </p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={submitting}
                rows={3}
                maxLength={RESPONSE_MAX}
                placeholder="Ваш ответ..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 resize-none transition-colors disabled:opacity-60"
              />
              <p
                className={`text-[11px] text-right tabular-nums transition-colors ${
                  draft.length >= RESPONSE_MAX
                    ? 'text-destructive font-medium'
                    : draft.length > RESPONSE_MAX * 0.85
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-muted-foreground/50'
                }`}
              >
                {draft.length} / {RESPONSE_MAX}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => void submitResponse()}
                  disabled={submitting || !draft.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  Отправить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
