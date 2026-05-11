import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  Package,
  PenLine,
  RotateCcw,
  ShoppingBag,
  Star,
  Truck,
  MessageSquareOff,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMyReviews } from '@/hooks/use-my-reviews'
import { StarRating } from '@/components/ui/star-rating'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { pluralize, cn } from '@/lib/utils'
import { shortOrderId } from '@/lib/format'
import type { ReviewSummaryDto, ReviewSubjectType, PendingReviewSubjectDto } from '@/api/reviews'

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECT_LABELS: Record<ReviewSubjectType, string> = {
  Product: 'Товар',
  Seller: 'Продавец',
  Courier: 'Курьер',
}

const SUBJECT_COLORS: Record<ReviewSubjectType, string> = {
  Product: 'bg-primary/10 text-primary border-primary/20',
  Seller: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Courier: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
}

type SortKey = 'DateDesc' | 'DateAsc' | 'RatingDesc' | 'RatingAsc'

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'DateDesc',
    label: 'Сначала новые',
    icon: (
      <>
        <Clock className="w-3 h-3" />
        <ArrowDown className="w-3 h-3" />
      </>
    ),
  },
  {
    key: 'DateAsc',
    label: 'Сначала старые',
    icon: (
      <>
        <Clock className="w-3 h-3" />
        <ArrowUp className="w-3 h-3" />
      </>
    ),
  },
  {
    key: 'RatingDesc',
    label: 'Высокий рейтинг',
    icon: (
      <>
        <Star className="w-3 h-3" />
        <ArrowDown className="w-3 h-3" />
      </>
    ),
  },
  {
    key: 'RatingAsc',
    label: 'Низкий рейтинг',
    icon: (
      <>
        <Star className="w-3 h-3" />
        <ArrowUp className="w-3 h-3" />
      </>
    ),
  },
]

function sortReviews(items: ReviewSummaryDto[], sort: SortKey): ReviewSummaryDto[] {
  return [...items].sort((a, b) => {
    if (sort === 'DateDesc')
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    if (sort === 'DateAsc')
      return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
    if (sort === 'RatingDesc') return (b.rating ?? 0) - (a.rating ?? 0)
    return (a.rating ?? 0) - (b.rating ?? 0)
  })
}

function subjectLink(type: ReviewSubjectType, id: string): string | null {
  if (type === 'Product') return `/product/${id}`
  if (type === 'Seller') return `/sellers/${id}`
  return null
}

function SubjectIcon({ type }: { type: ReviewSubjectType }) {
  if (type === 'Product') return <ShoppingBag className="w-3 h-3" />
  if (type === 'Seller') return <Package className="w-3 h-3" />
  return <Truck className="w-3 h-3" />
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-foreground text-background text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
        {text}
      </div>
    </div>
  )
}

// ── Pending section ───────────────────────────────────────────────────────────

function PendingSection({
  subjects,
  loading,
}: {
  subjects: PendingReviewSubjectDto[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-4 mb-6 space-y-2 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded-full" />
        <div className="h-10 bg-muted rounded-xl" />
      </div>
    )
  }
  if (subjects.length === 0) return null

  // Group by orderId
  const grouped = subjects.reduce<Record<string, PendingReviewSubjectDto[]>>((acc, s) => {
    const key = s.orderId ?? 'unknown'
    acc[key] = acc[key] ?? []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/25 p-4 mb-6 space-y-3"
      style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
    >
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Ожидают вашего отзыва</p>
        <span className="ml-auto text-xs text-muted-foreground">
          {subjects.length} {pluralize(subjects.length, 'позиция', 'позиции', 'позиций')}
        </span>
      </div>

      <div className="space-y-2">
        {Object.entries(grouped).map(([orderId, items]) => (
          <div
            key={orderId}
            className="rounded-xl border border-border bg-background/50 px-3 py-2 space-y-1.5"
          >
            <Link
              to={`/orders/${orderId}`}
              className="inline-block text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Заказ #{shortOrderId(orderId)}
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
                {items.map((s) => {
                  const subjectId = s.subjectId ?? ''
                  const type = s.subjectType!
                  const name = s.subjectName ?? SUBJECT_LABELS[type]
                  const link = subjectLink(type, subjectId)
                  const badgeClass = cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border transition-opacity',
                    SUBJECT_COLORS[type],
                    link && 'hover:opacity-70',
                  )
                  return link ? (
                    <Link key={subjectId} to={link} className={badgeClass}>
                      <SubjectIcon type={type} />
                      {name}
                    </Link>
                  ) : (
                    <span key={subjectId} className={badgeClass}>
                      <SubjectIcon type={type} />
                      {name}
                    </span>
                  )
                })}
              </div>
              <Link
                to={`/reviews/new?orderId=${orderId}`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <PenLine className="w-3 h-3" />
                Оценить
              </Link>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── My review card ─────────────────────────────────────────────────────────────

const LONG_COMMENT_CHARS = 300

function MyReviewCard({
  review,
  onDelete,
}: {
  review: ReviewSummaryDto
  onDelete: (id: string) => Promise<boolean>
}) {
  const [expanded, setExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subjectType = review.subjectType!
  const subjectName = review.subjectName ?? null
  const photos = (review.photos ?? []).map((p) => p.storageUrl ?? '').filter(Boolean)
  const isLong = !!review.comment && review.comment.length > LONG_COMMENT_CHARS
  const link = subjectLink(subjectType, review.subjectId ?? '')

  const handleDelete = async () => {
    setDeleting(true)
    const ok = await onDelete(review.id ?? '')
    if (!ok) setDeleting(false)
  }

  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <div
      className="rounded-2xl border border-border p-4 flex flex-col gap-3"
      style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border',
              SUBJECT_COLORS[subjectType],
            )}
          >
            <SubjectIcon type={subjectType} />
            {SUBJECT_LABELS[subjectType]}
          </span>

          {subjectName &&
            (link ? (
              <Link
                to={link}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary transition-colors truncate max-w-50"
              >
                {subjectName}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </Link>
            ) : (
              <span className="text-xs font-medium text-foreground truncate max-w-50">
                {subjectName}
              </span>
            ))}

          {review.isVisible === false && (
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              На модерации
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <StarRating rating={review.rating ?? 0} size={14} />
          <span className="text-[11px] text-muted-foreground">{date}</span>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <div className="flex flex-col items-start gap-1.5">
          <motion.div
            initial={false}
            animate={{ height: expanded || !isLong ? 'auto' : Math.round(14 * 1.625 * 4) }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden w-full"
          >
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word">
              {review.comment}
            </p>
          </motion.div>
          {isLong && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-sm font-medium text-primary hover:underline transition-colors focus-visible:outline-none cursor-pointer"
            >
              {expanded ? 'Свернуть' : 'Читать полностью'}
            </button>
          )}
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((src, i) => (
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
            photos={photos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

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

      {/* Delete */}
      <ConfirmDelete
        confirming={confirming}
        onConfirmingChange={(v) => {
          if (!deleting) setConfirming(v)
        }}
        label="Удалить отзыв"
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS: { value: ReviewSubjectType | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'Product', label: 'Товары' },
  { value: 'Seller', label: 'Продавцы' },
  { value: 'Courier', label: 'Курьеры' },
]

export function MyReviewsPage() {
  const {
    reviews,
    loading,
    error,
    hasNextPage,
    totalCount,
    pendingSubjects,
    pendingLoading,
    loadMore,
    deleteReview,
  } = useMyReviews()

  const [typeFilter, setTypeFilter] = useState<ReviewSubjectType | ''>('')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [sort, setSort] = useState<SortKey>('DateDesc')

  const filtered = useMemo(() => {
    const base = reviews.filter(
      (r) =>
        (!typeFilter || r.subjectType === typeFilter) &&
        (ratingFilter === null || r.rating === ratingFilter),
    )
    return sortReviews(base, sort)
  }, [reviews, typeFilter, ratingFilter, sort])

  const isFiltered = typeFilter !== '' || ratingFilter !== null || sort !== 'DateDesc'

  const reset = () => {
    setTypeFilter('')
    setRatingFilter(null)
    setSort('DateDesc')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Мои отзывы</h1>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground ml-1">
            {reviews.length}
            {hasNextPage ? '+' : ''} из {totalCount}
          </span>
        )}
      </div>

      {/* Pending section */}
      <PendingSection subjects={pendingSubjects} loading={pendingLoading} />

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {TYPE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTypeFilter(opt.value)}
            className={cn(
              'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              typeFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Star filter + sort row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        {/* Star chips */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className={cn(
              'text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer',
              ratingFilter === null
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            Все ★
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRatingFilter(ratingFilter === s ? null : s)}
              className={cn(
                'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer',
                ratingFilter === s
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {s}
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </button>
          ))}
        </div>

        {/* Sort buttons + reset */}
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <Tooltip key={opt.key} text={opt.label}>
              <button
                type="button"
                onClick={() => setSort(opt.key)}
                className={cn(
                  'flex items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors cursor-pointer',
                  sort === opt.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {opt.icon}
              </button>
            </Tooltip>
          ))}
          {isFiltered && (
            <Tooltip text="Сбросить фильтры">
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer ml-1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Filtered count hint */}
      {isFiltered && reviews.length > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length > 0
            ? `Показано ${filtered.length} ${pluralize(filtered.length, 'отзыв', 'отзыва', 'отзывов')}`
            : null}
        </p>
      )}

      {/* Content */}
      {loading && reviews.length === 0 ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card/60 h-28 animate-pulse"
            />
          ))}
        </div>
      ) : error && reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-12 flex flex-col items-center gap-3 text-center">
          <MessageSquareOff className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isFiltered ? 'Нет отзывов с такими фильтрами' : 'Вы ещё не оставляли отзывов'}
          </p>
          {!isFiltered && (
            <Link to="/orders" className="text-xs text-primary hover:underline">
              К моим заказам
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <MyReviewCard key={review.id} review={review} onDelete={deleteReview} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && !loading && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={loadMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
          >
            Показать ещё
          </button>
        </div>
      )}

      {loading && reviews.length > 0 && (
        <div className="flex justify-center mt-6">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      )}
    </div>
  )
}
