import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import type { OrderPhotoDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

interface OrderPhotoModalProps {
  photo: OrderPhotoDto | null
  busy: boolean
  onClose: () => void
  onDelete: (photoId: string) => Promise<void>
}

export function OrderPhotoModal({ photo, busy, onClose, onDelete }: OrderPhotoModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleClose = () => {
    if (busy) return
    setConfirmDelete(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!photo?.id) return
    await onDelete(photo.id)
    onClose()
  }

  const modal = (
    <AnimatePresence>
      {photo && (
        <motion.div
          key="order-photo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <motion.div
            key="order-photo-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Фото заказа</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {busy ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="w-full bg-black/20" style={{ maxHeight: 400 }}>
                  <img
                    src={photo.storageUrl ?? noImageUrl}
                    alt=""
                    className="w-full object-contain"
                    style={{ maxHeight: 400 }}
                  />
                </div>
                <div className="p-5">
                  <ConfirmDelete
                    confirming={confirmDelete}
                    onConfirmingChange={setConfirmDelete}
                    label="Удалить фото"
                    onConfirm={() => void handleDelete()}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
