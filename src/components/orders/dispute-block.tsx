import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { ProfileSelect } from '@/components/ui/profile-select'
import { PhotosSection } from '@/components/ui/photos-section'
import { useAuth } from '@/contexts/auth-context'
import { DISPUTE_OUTCOME_LABELS } from '@/lib/format'
import type { DisputeDto, DisputeType, DisputeStatus, DisputePhotoDto } from '@/api/orders'

const REASON_MAX = 2000

const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  Open: 'Открыт',
  Resolved: 'Решён',
  Closed: 'Закрыт',
}


const DISPUTE_TYPE_OPTIONS: { value: DisputeType; label: string }[] = [
  { value: 'NotDelivered', label: 'Товар не доставлен' },
  { value: 'WrongItem', label: 'Прислали не тот товар' },
  { value: 'DefectiveItem', label: 'Товар с дефектом' },
  { value: 'CourierIssue', label: 'Проблема с курьером' },
  { value: 'Other', label: 'Другое' },
]

export interface DisputeBlockProps {
  dispute: DisputeDto | null | undefined
  canOpenDispute: boolean
  busy: boolean
  onOpen: (type: DisputeType, reason: string) => Promise<boolean>
  onUploadPhoto: (files: Blob[]) => Promise<DisputePhotoDto[] | null>
  onDeletePhoto: (photoId: string) => Promise<void>
}

// ── Open dispute form ─────────────────────────────────────────────────────────

function OpenDisputeForm({
  busy,
  onOpen,
}: {
  busy: boolean
  onOpen: (type: DisputeType, reason: string) => Promise<boolean>
}) {
  const [confirming, setConfirming] = useState(false)
  const [disputeType, setDisputeType] = useState<DisputeType>('Other')
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason.trim()) { setReasonError('Опишите проблему'); return }
    if (reason.length > REASON_MAX) { setReasonError(`Максимум ${REASON_MAX} символов`); return }
    setReasonError(null)
    const ok = await onOpen(disputeType, reason.trim())
    if (ok) setConfirming(false)
  }

  const handleClose = () => { setConfirming(false); setReasonError(null) }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-orange-500/25 bg-orange-500/5"
        >
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-orange-500/15">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Открыть спор</p>
          </div>

          <div className="px-4 py-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Менеджер рассмотрит обращение и свяжется с вами.
            </p>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Причина спора
              </label>
              <ProfileSelect
                options={DISPUTE_TYPE_OPTIONS}
                value={disputeType}
                onChange={(v) => setDisputeType(v as DisputeType)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Описание <span className="text-destructive">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError(null) }}
                rows={3}
                maxLength={REASON_MAX}
                placeholder="Подробно опишите проблему..."
                className={`w-full px-3 py-2 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none transition-colors ${
                  reasonError ? 'border-destructive/60' : 'border-border focus:border-primary/50'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {reasonError
                  ? <p className="text-xs text-destructive">{reasonError}</p>
                  : <span />}
                <span className={`text-[11px] tabular-nums ${
                  reason.length >= REASON_MAX
                    ? 'text-destructive'
                    : reason.length > REASON_MAX * 0.9
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground/50'
                }`}>
                  {reason.length}/{REASON_MAX}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="flex-1 h-9 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={busy}
                className="flex-1 h-9 rounded-xl bg-orange-500 text-white text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-orange-500/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Отправить
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="cta"
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="w-full h-10 rounded-xl border border-orange-500/30 text-orange-700 dark:text-orange-400 text-sm flex items-center justify-center gap-1.5 hover:bg-orange-500/8 transition-colors cursor-pointer disabled:opacity-50"
        >
          <AlertTriangle className="w-4 h-4" />
          Открыть спор
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ── Dispute block ─────────────────────────────────────────────────────────────

export function DisputeBlock({
  dispute,
  canOpenDispute,
  busy,
  onOpen,
  onUploadPhoto,
  onDeletePhoto,
}: DisputeBlockProps) {
  const { user } = useAuth()

  if (!dispute && !canOpenDispute) return null

  // No dispute yet — show only the open-dispute button/form
  if (!dispute) {
    return <OpenDisputeForm busy={busy} onOpen={onOpen} />
  }

  // Dispute exists — show info + photos + open form if still open and canOpen
  return (
    <section className="rounded-2xl border border-orange-500/30 p-4 bg-orange-500/5 space-y-3">
      {/* Header row: label + status badge */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wide">
          Спор
        </p>
        {dispute.status && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
              dispute.status === 'Open'
                ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400'
                : dispute.status === 'Resolved'
                  ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {DISPUTE_STATUS_LABELS[dispute.status]}
          </span>
        )}
      </div>

      {/* Outcome */}
      {dispute.outcome && (
        <div
          className={`text-xs font-medium px-3 py-2 rounded-lg ${
            dispute.outcome === 'BuyerFavored'
              ? 'bg-green-500/12 text-green-700 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {DISPUTE_OUTCOME_LABELS[dispute.outcome]}
        </div>
      )}

      {/* Reason */}
      <p className="text-sm text-foreground">{dispute.reason ?? 'Без описания'}</p>

      {/* Resolution */}
      {dispute.resolution && (
        <p className="text-xs text-muted-foreground border-t border-orange-500/15 pt-2">
          Решение: {dispute.resolution}
        </p>
      )}

      {/* Photos */}
      <div className="border-t border-orange-500/15 pt-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">Фотографии</p>
        <PhotosSection
          photos={dispute.photos ?? []}
          busy={busy}
          modalTitle="Фото спора"
          readOnly={dispute.status !== 'Open' || dispute.initiatorId !== user?.id}
          onUpload={async (files) => { await onUploadPhoto(files) }}
          onDelete={onDeletePhoto}
        />
      </div>
    </section>
  )
}
