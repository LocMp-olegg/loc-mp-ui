import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Star, Loader2 } from 'lucide-react'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { ProductsService } from '@/api/catalog'
import type { ProductPhotoDto } from '@/api/catalog'
import noImageUrl from '@/assets/no-image-available.jpg'

interface ProductPhotoModalProps {
  photo: ProductPhotoDto | null
  productId: string
  onClose: () => void
  onDelete: (photoId: string) => void
  onSetMain: (photoId: string) => void
}

type Phase = 'view' | 'busy'

export function ProductPhotoModal({
  photo,
  productId,
  onClose,
  onDelete,
  onSetMain,
}: ProductPhotoModalProps) {
  const [phase, setPhase] = useState<Phase>('view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (phase === 'busy') return
    setConfirmDelete(false)
    setError(null)
    setPhase('view')
    onClose()
  }

  const handleSetMain = async () => {
    if (!photo?.id) return
    setPhase('busy')
    setError(null)
    try {
      await ProductsService.patchApiCatalogProductsPhotosSetMain({ productId, photoId: photo.id })
      onSetMain(photo.id)
      onClose()
    } catch {
      setError('Не удалось установить главное фото')
      setPhase('view')
    }
  }

  const handleDelete = async () => {
    if (!photo?.id) return
    setPhase('busy')
    setError(null)
    try {
      await ProductsService.deleteApiCatalogProductsPhotos({ productId, photoId: photo.id })
      onDelete(photo.id)
      onClose()
    } catch {
      setError('Не удалось удалить фото')
      setPhase('view')
    }
  }

  const modal = (
    <AnimatePresence>
      {photo && (
        <motion.div
          key="product-photo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-210 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <motion.div
            key="product-photo-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {photo.isMain && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
                {photo.isMain ? 'Главное фото' : 'Фото товара'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={phase === 'busy'}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {phase === 'busy' ? (
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
                <div className="p-5 space-y-2">
                  {error && <p className="text-xs text-destructive mb-1">{error}</p>}
                  {!photo.isMain && (
                    <button
                      type="button"
                      onClick={() => void handleSetMain()}
                      className="w-full h-10 rounded-xl border border-border text-sm text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Star className="w-4 h-4" />
                      Сделать главным
                    </button>
                  )}
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
