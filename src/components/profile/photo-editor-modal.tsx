import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { X, RotateCcw, RotateCw, Upload, Loader2, Trash2, Check } from 'lucide-react'

interface PhotoEditorModalProps {
  open: boolean
  hasPhoto: boolean
  photoUrl: string | null
  userName: string | null
  onClose: () => void
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
}

type Phase = 'view' | 'crop' | 'busy'

async function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area, rotation: number): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const rad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const bW = image.width * cos + image.height * sin
  const bH = image.width * sin + image.height * cos

  const offscreen = document.createElement('canvas')
  offscreen.width = bW
  offscreen.height = bH
  const offCtx = offscreen.getContext('2d')!
  offCtx.translate(bW / 2, bH / 2)
  offCtx.rotate(rad)
  offCtx.drawImage(image, -image.width / 2, -image.height / 2)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.drawImage(
    offscreen,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas toBlob failed'))),
      'image/webp',
      0.92,
    ),
  )
}

export function PhotoEditorModal({
  open,
  hasPhoto,
  photoUrl,
  userName,
  onClose,
  onUpload,
  onDelete,
}: PhotoEditorModalProps) {
  const [phase, setPhase] = useState<Phase>('view')
  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetCropState = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedArea(null)
  }

  const handleClose = () => {
    if (phase === 'busy') return
    if (srcUrl) {
      URL.revokeObjectURL(srcUrl)
      setSrcUrl(null)
    }
    resetCropState()
    setError(null)
    setConfirmDelete(false)
    setPhase('view')
    onClose()
  }

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (максимум 5 МБ)')
      return
    }
    if (srcUrl) URL.revokeObjectURL(srcUrl)
    setSrcUrl(URL.createObjectURL(file))
    resetCropState()
    setError(null)
    setPhase('crop')
  }

  const handleCropComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedArea(pixelCrop)
  }, [])

  const handleSave = async () => {
    if (!srcUrl || !croppedArea) return
    setPhase('busy')
    setError(null)
    try {
      const blob = await getCroppedBlob(srcUrl, croppedArea, rotation)
      const file = new File([blob], 'photo.webp', { type: 'image/webp' })
      await onUpload(file)
      URL.revokeObjectURL(srcUrl)
      setSrcUrl(null)
      resetCropState()
      setPhase('view')
    } catch {
      setError('Не удалось сохранить фото')
      setPhase('crop')
    }
  }

  const handleDelete = async () => {
    setPhase('busy')
    setError(null)
    try {
      await onDelete()
      setConfirmDelete(false)
      setPhase('view')
    } catch {
      setError('Не удалось удалить фото')
      setPhase('view')
    }
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="photo-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-200 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <motion.div
            key="photo-modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                {phase === 'crop' ? 'Обрезать фото' : 'Фото профиля'}
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
            {phase === 'crop' && srcUrl ? (
              <div className="flex flex-col">
                {/* Cropper */}
                <div className="relative w-full" style={{ height: 280 }}>
                  <Cropper
                    image={srcUrl}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
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

                {/* Controls */}
                <div className="px-5 py-4 space-y-3">
                  {/* Zoom */}
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

                  {/* Rotate */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8 shrink-0">{rotation}°</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRotation((r) => r - 90)}
                        className="h-8 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        −90°
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((r) => r + 90)}
                        className="h-8 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        +90°
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
                        if (srcUrl) {
                          URL.revokeObjectURL(srcUrl)
                          setSrcUrl(null)
                        }
                        resetCropState()
                      }}
                      className="h-9 px-4 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      Отмена
                    </button>
                    <motion.button
                      type="button"
                      onClick={() => void handleSave()}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Сохранить
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : phase === 'busy' ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
            ) : (
              /* view phase */
              <div className="p-5 flex flex-col items-center gap-5">
                {/* Photo preview */}
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={userName ?? 'Аватар'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl text-muted-foreground/30 select-none">
                        {userName?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                  )}
                </div>

                {error && <p className="text-xs text-destructive text-center">{error}</p>}

                {/* Actions */}
                <div className="w-full space-y-2">
                  {/* Upload / Replace */}
                  <motion.button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {hasPhoto ? 'Заменить фото' : 'Загрузить фото'}
                  </motion.button>

                  {/* Delete */}
                  {hasPhoto && (
                    <AnimatePresence mode="wait" initial={false}>
                      {confirmDelete ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 h-10 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            Отмена
                          </button>
                          <motion.button
                            type="button"
                            onClick={() => void handleDelete()}
                            whileTap={{ scale: 0.97 }}
                            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="delete-btn"
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full h-10 rounded-xl border border-destructive/30 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/8 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить фото
                        </motion.button>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
                e.target.value = ''
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
