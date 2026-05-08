import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Plus, X } from 'lucide-react'
import { ConfirmDelete } from '@/components/ui/confirm-delete'
import { cn } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'

export interface Photo {
  id?: string
  storageUrl?: string | null
}

interface PhotosSectionProps {
  photos: Photo[]
  busy: boolean
  maxPhotos?: number
  modalTitle?: string
  readOnly?: boolean
  onUpload: (files: Blob[]) => Promise<void>
  onDelete: (photoId: string) => Promise<void>
}

// ── Inline photo modal ────────────────────────────────────────────────────────

function PhotoModal({
  photo,
  busy,
  title,
  readOnly,
  onClose,
  onDelete,
}: {
  photo: Photo | null
  busy: boolean
  title: string
  readOnly: boolean
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleClose = () => {
    if (busy) return
    setConfirmDelete(false)
    onClose()
  }

  const modal = (
    <AnimatePresence>
      {photo && (
        <motion.div
          key="photos-backdrop"
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
            key="photos-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
                {!readOnly && (
                  <div className="p-5">
                    <ConfirmDelete
                      confirming={confirmDelete}
                      onConfirmingChange={setConfirmDelete}
                      label="Удалить фото"
                      onConfirm={() => {
                        if (photo.id) void onDelete(photo.id)
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}

// ── Photos section ────────────────────────────────────────────────────────────

export function PhotosSection({
  photos,
  busy,
  maxPhotos = 10,
  modalTitle = 'Фото',
  readOnly = false,
  onUpload,
  onDelete,
}: PhotosSectionProps) {
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<Photo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList) => void onUpload(Array.from(files) as Blob[])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        className={cn(
          'rounded-xl transition-all duration-150',
          dragging && 'ring-2 ring-primary/50 bg-primary/5',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(photo)}
              className="aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:opacity-85 transition-opacity cursor-pointer"
            >
              <img
                src={photo.storageUrl ?? noImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}

          {!readOnly && photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Plus className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-[10px] text-muted-foreground">
                {dragging ? 'Отпустите' : 'Добавить'}
              </span>
            </button>
          )}
        </div>

        {!readOnly &&
          (photos.length >= maxPhotos ? (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Достигнут лимит {maxPhotos} фотографий
            </p>
          ) : photos.length > 0 ? (
            <p className="text-[11px] text-muted-foreground/60 mt-2">
              {photos.length} / {maxPhotos} · ещё можно {maxPhotos - photos.length} фото
            </p>
          ) : null)}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <PhotoModal
        photo={selected}
        busy={busy}
        title={modalTitle}
        readOnly={readOnly}
        onClose={() => setSelected(null)}
        onDelete={async (id) => {
          await onDelete(id)
          setSelected(null)
        }}
      />
    </div>
  )
}
