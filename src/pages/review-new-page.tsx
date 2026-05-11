import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
  X,
  Plus,
  Send,
} from 'lucide-react'
import { useReviewForm } from '@/hooks/use-review-form'
import { shortOrderId } from '@/lib/format'
import type { ReviewSubjectType } from '@/api/reviews'
import type { SubjectForm } from '@/hooks/use-review-form'

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUBJECT_LABELS: Record<ReviewSubjectType, string> = {
  Product: 'Товар',
  Seller: 'Продавец',
  Courier: 'Курьер',
}

function subjectLink(type: ReviewSubjectType, id: string): string | null {
  if (type === 'Product') return `/product/${id}`
  if (type === 'Seller') return `/sellers/${id}`
  return null
}

function SubjectIcon({ type, className }: { type: ReviewSubjectType; className?: string }) {
  if (type === 'Product') return <ShoppingBag className={className} />
  if (type === 'Seller') return <Package className={className} />
  return <Truck className={className} />
}

// ── Star input ────────────────────────────────────────────────────────────────

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

function StarInput({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  const active = hover || rating

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          className="cursor-pointer focus-visible:outline-none"
          aria-label={`${star} звезд`}
        >
          <svg
            viewBox="0 0 24 24"
            width={28}
            height={28}
            className="transition-transform hover:scale-110"
          >
            <path
              d={STAR_PATH}
              className={
                star <= active ? 'fill-amber-400 stroke-amber-400' : 'fill-border stroke-border'
              }
              strokeWidth="0"
            />
          </svg>
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-1 text-sm text-muted-foreground tabular-nums">
          {['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'][rating]}
        </span>
      )}
    </div>
  )
}

// ── File preview ──────────────────────────────────────────────────────────────

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [src, setSrc] = useState('')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => setSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [file])

  return (
    <>
      <div className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted">
        {src && (
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setExpanded(true)}
            draggable={false}
          />
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>

      {expanded &&
        src &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
            onClick={() => setExpanded(false)}
          >
            <img
              src={src}
              alt=""
              className="max-h-[90vh] max-w-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}

// ── Subject card ──────────────────────────────────────────────────────────────

const COMMENT_MAX = 2000

function SubjectCard({
  subject,
  submitted,
  busy,
  submitError,
  onRating,
  onComment,
  onAddFiles,
  onRemoveFile,
  onSubmit,
}: {
  subject: SubjectForm
  submitted: boolean
  busy: boolean
  submitError: string | null
  onRating: (r: number) => void
  onComment: (c: string) => void
  onAddFiles: (files: File[]) => void
  onRemoveFile: (index: number) => void
  onSubmit: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const remaining = 5 - subject.files.length

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-primary/30 p-4 flex items-center gap-3"
        style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
      >
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {SUBJECT_LABELS[subject.subjectType]}
          </p>
          <p className="text-sm font-medium text-foreground">{subject.label} — отзыв отправлен</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div
      className="rounded-2xl border border-border p-4 space-y-4"
      style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
    >
      {/* Subject header */}
      <div className="flex items-center gap-3">
        {subject.thumbnail ? (
          <img
            src={subject.thumbnail}
            alt=""
            className="w-11 h-11 rounded-xl object-cover bg-muted shrink-0 border border-border"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
            <SubjectIcon type={subject.subjectType} className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {SUBJECT_LABELS[subject.subjectType]}
          </p>
          {subjectLink(subject.subjectType, subject.subjectId) ? (
            <Link
              to={subjectLink(subject.subjectType, subject.subjectId)!}
              className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors"
            >
              {subject.label}
            </Link>
          ) : (
            <p className="text-sm font-semibold text-foreground truncate">{subject.label}</p>
          )}
        </div>
      </div>

      {/* Stars */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Оценка</p>
        <StarInput rating={subject.rating} onChange={onRating} />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Комментарий <span className="text-muted-foreground/50 font-normal">(необязательно)</span>
        </label>
        <textarea
          value={subject.comment}
          onChange={(e) => onComment(e.target.value)}
          disabled={busy}
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder="Поделитесь впечатлением..."
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 resize-none transition-colors disabled:opacity-60"
        />
        <p
          className={`text-[11px] text-right mt-0.5 tabular-nums transition-colors ${
            subject.comment.length >= COMMENT_MAX
              ? 'text-destructive font-medium'
              : subject.comment.length > COMMENT_MAX * 0.85
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-muted-foreground/50'
          }`}
        >
          {subject.comment.length} / {COMMENT_MAX}
        </p>
      </div>

      {/* Photos — not supported for Seller reviews */}
      {subject.subjectType !== 'Seller' && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Фото <span className="text-muted-foreground/50 font-normal">(необязательно, до 5)</span>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {subject.files.map((file, i) => (
              <FilePreview key={i} file={file} onRemove={() => onRemoveFile(i)} />
            ))}
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-60"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(Array.from(e.target.files))
              e.target.value = ''
            }}
          />
        </div>
      )}

      {submitError && <p className="text-xs text-destructive">{submitError}</p>}

      {/* Per-subject submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Отправить отзыв
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ReviewNewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('orderId')

  const {
    subjects,
    loading,
    error,
    busy,
    submittedIds,
    subjectErrors,
    allDone,
    setRating,
    setComment,
    addFiles,
    removeFile,
    submitOne,
  } = useReviewForm(orderId)

  useEffect(() => {
    if (!allDone) return
    const timer = setTimeout(() => {
      navigate(orderId ? `/orders/${orderId}` : '/orders')
    }, 1800)
    return () => clearTimeout(timer)
  }, [allDone, orderId, navigate])

  const isAlreadyReviewed = error === 'already_reviewed'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">Оставить отзыв</h1>
      {orderId && (
        <Link
          to={`/orders/${orderId}`}
          className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          Заказ #{shortOrderId(orderId)}
        </Link>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-2xl border border-border p-8 text-center space-y-3"
          style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
        >
          {isAlreadyReviewed ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
              <p className="text-sm font-medium text-foreground">Вы уже оценили этот заказ</p>
              <p className="text-xs text-muted-foreground">
                Отзыв для каждого пункта можно оставить только один раз.
              </p>
            </>
          ) : (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Link to="/orders" className="inline-block text-xs text-primary hover:underline mt-2">
            К списку заказов
          </Link>
        </div>
      )}

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="rounded-2xl border border-primary/30 p-8 text-center space-y-3"
            style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
          >
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <p className="text-base font-semibold text-foreground">Спасибо за отзывы!</p>
            <p className="text-sm text-muted-foreground">
              Ваши оценки помогают другим покупателям.
            </p>
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50 mx-auto" />
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !error && !allDone && subjects.length > 0 && (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.subjectId}
              subject={subject}
              submitted={submittedIds.includes(subject.subjectId)}
              busy={busy}
              submitError={subjectErrors[subject.subjectId] ?? null}
              onRating={(r) => setRating(subject.subjectId, r)}
              onComment={(c) => setComment(subject.subjectId, c)}
              onAddFiles={(files) => addFiles(subject.subjectId, files)}
              onRemoveFile={(i) => removeFile(subject.subjectId, i)}
              onSubmit={() => void submitOne(subject.subjectId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
