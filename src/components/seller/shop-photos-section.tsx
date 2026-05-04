import React, { useState, useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { ShopsService } from '@/api/catalog'
import type { ShopPhotoDto } from '@/api/catalog'
import { ShopPhotoModal } from '@/components/seller/shop-photo-modal'
import { cn } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'

const MAX_PHOTOS = 50

interface ShopPhotosSectionProps {
  shopId: string
  photos: ShopPhotoDto[]
  onUpdate: (photos: ShopPhotoDto[]) => void
}

export function ShopPhotosSection({ shopId, photos, onUpdate }: ShopPhotosSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<ShopPhotoDto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList) => {
    const available = MAX_PHOTOS - photos.length
    if (available <= 0) return
    setUploading(true)
    setError(null)
    try {
      const allFiles = Array.from(files).slice(0, available) as Blob[]
      const accumulated: ShopPhotoDto[] = []
      for (let i = 0; i < allFiles.length; i += 10) {
        const batch = allFiles.slice(i, i + 10)
        const newPhotos = await ShopsService.postApiCatalogShopsPhotos({
          id: shopId,
          formData: { images: batch },
        })
        accumulated.push(...newPhotos)
      }
      onUpdate([...photos, ...accumulated])
    } catch {
      setError('Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
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
    if (e.dataTransfer.files.length) void handleUpload(e.dataTransfer.files)
  }

  return (
    <div
      className={cn('rounded-xl transition-all duration-150', dragging && 'ring-2 ring-primary/50 bg-primary/5')}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:opacity-85 transition-opacity cursor-pointer"
          >
            <img src={photo.storageUrl ?? noImageUrl} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground leading-tight">
              {dragging ? 'Отпустите' : 'Добавить'}
            </span>
          </button>
        )}
      </div>

      {photos.length >= MAX_PHOTOS && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Достигнут лимит {MAX_PHOTOS} фотографий
        </p>
      )}
      {dragging && photos.length < MAX_PHOTOS && (
        <p className="text-xs text-primary text-center py-1 font-medium">Перетащите файлы для загрузки</p>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleUpload(e.target.files)
          e.target.value = ''
        }}
      />

      {selectedPhoto && (
        <ShopPhotoModal
          photo={selectedPhoto}
          shopId={shopId}
          onClose={() => setSelectedPhoto(null)}
          onDelete={(id) => {
            onUpdate(photos.filter((p) => p.id !== id))
            setSelectedPhoto(null)
          }}
          onReplace={(oldId, newPhoto) => {
            onUpdate(photos.map((p) => (p.id === oldId ? newPhoto : p)))
            setSelectedPhoto(null)
          }}
        />
      )}
    </div>
  )
}
