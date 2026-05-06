import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { X, RotateCcw, RotateCw, Check, Loader2, Crop } from 'lucide-react'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { ShopsService } from '@/api/catalog'
import type { ShopPhotoDto } from '@/api/catalog'
import { getCroppedBlob } from '@/lib/image-utils'

interface ShopPhotoModalProps {
  photo: ShopPhotoDto | null
  shopId: string
  onClose: () => void
  onDelete: (photoId: string) => void
  onReplace: (oldId: string, newPhoto: ShopPhotoDto) => void
}

type Phase = 'view' | 'crop' | 'busy'

export function ShopPhotoModal({
  photo,
  shopId,
  onClose,
  onDelete,
  onReplace,
}: ShopPhotoModalProps) {
  const [phase, setPhase] = useState<Phase>('view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedArea(null)
  }

  const handleClose = () => {
    if (phase === 'busy') return
    resetCrop()
    setConfirmDelete(false)
    setError(null)
    setPhase('view')
    onClose()
  }

  const handleCropComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedArea(pixelCrop)
  }, [])

  const handleSaveCrop = async () => {
    if (!photo?.storageUrl || !photo.id || !croppedArea) return
    setPhase('busy')
    setError(null)
    try {
      const blob = await getCroppedBlob(photo.storageUrl, croppedArea, rotation)
      const file = new File([blob], 'photo.webp', { type: 'image/webp' })
      await ShopsService.deleteApiCatalogShopsPhotos({ shopId, photoId: photo.id })
      const newPhotos = await ShopsService.postApiCatalogShopsPhotos({
        id: shopId,
        formData: { images: [file] },
      })
      onReplace(photo.id, newPhotos[0])
      onClose()
    } catch {
      setError('Не удалось сохранить фото')
      setPhase('crop')
    }
  }

  const handleDelete = async () => {
    if (!photo?.id) return
    setPhase('busy')
    setError(null)
    try {
      await ShopsService.deleteApiCatalogShopsPhotos({ shopId, photoId: photo.id })
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
          key="shop-photo-backdrop"
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
            key="shop-photo-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                {phase === 'crop' ? 'Обрезать фото' : 'Просмотр фото'}
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

            {/* Body */}
            {phase === 'crop' ? (
              <div className="flex flex-col">
                <div className="relative w-full" style={{ height: 320 }}>
                  <Cropper
                    image={photo.storageUrl ?? ''}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={4 / 3}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={handleCropComplete}
                    showGrid={false}
                    style={{
                      containerStyle: { borderRadius: 0 },
                      cropAreaStyle: { border: '2px solid hsl(var(--primary))' },
                    }}
                  />
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8 shrink-0">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 h-1.5 accent-primary cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8 shrink-0">{rotation}°</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRotation((r) => r - 90)}
                        className="h-8 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> −90°
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((r) => r + 90)}
                        className="h-8 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" /> +90°
                      </button>
                    </div>
                    {rotation !== 0 && (
                      <button
                        type="button"
                        onClick={() => setRotation(0)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Сброс
                      </button>
                    )}
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPhase('view')
                        resetCrop()
                      }}
                      className="h-9 px-4 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                    <motion.button
                      type="button"
                      onClick={() => void handleSaveCrop()}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Сохранить
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : phase === 'busy' ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Full photo */}
                <div className="w-full bg-black/20" style={{ maxHeight: 400 }}>
                  <img
                    src={photo.storageUrl ?? ''}
                    alt=""
                    className="w-full object-contain"
                    style={{ maxHeight: 400 }}
                  />
                </div>
                <div className="p-5 space-y-2">
                  {error && <p className="text-xs text-destructive mb-1">{error}</p>}
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('crop')
                      resetCrop()
                    }}
                    className="w-full h-10 rounded-xl border border-border text-sm text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Crop className="w-4 h-4" /> Обрезать
                  </button>
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
