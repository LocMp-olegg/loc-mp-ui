import React, { useState, useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { OrderPhotoModal } from './order-photo-modal'
import { cn } from '@/lib/utils'
import type { OrderPhotoDto } from '@/api/orders'
import noImageUrl from '@/assets/no-image-available.jpg'

const MAX_PHOTOS = 10

interface OrderPhotosSectionProps {
  photos: OrderPhotoDto[]
  busy: boolean
  onUpload: (files: Blob[]) => Promise<void>
  onDelete: (photoId: string) => Promise<void>
}

export function OrderPhotosSection({ photos, busy, onUpload, onDelete }: OrderPhotosSectionProps) {
  const [dragging, setDragging] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<OrderPhotoDto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList) => {
    void onUpload(Array.from(files) as Blob[])
  }

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
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:opacity-85 transition-opacity cursor-pointer"
            >
              <img
                src={photo.storageUrl ?? noImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}

          {photos.length < MAX_PHOTOS && (
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

        {photos.length >= MAX_PHOTOS && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Достигнут лимит {MAX_PHOTOS} фотографий
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <OrderPhotoModal
        photo={selectedPhoto}
        busy={busy}
        onClose={() => setSelectedPhoto(null)}
        onDelete={async (photoId) => {
          await onDelete(photoId)
          setSelectedPhoto(null)
        }}
      />
    </div>
  )
}
