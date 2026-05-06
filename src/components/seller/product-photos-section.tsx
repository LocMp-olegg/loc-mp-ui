import React, { useState, useRef } from 'react'
import { Loader2, Plus, Star } from 'lucide-react'
import { ProductsService } from '@/api/catalog'
import type { ProductPhotoDto } from '@/api/catalog'
import { ProductPhotoModal } from '@/components/seller/product-photo-modal'
import { cn } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'

interface ProductPhotosSectionProps {
  productId: string
  photos: ProductPhotoDto[]
  onReload: () => void
}

export function ProductPhotosSection({ productId, photos, onReload }: ProductPhotosSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<ProductPhotoDto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList) => {
    if (!files.length) return
    setUploading(true)
    setError(null)
    try {
      await ProductsService.postApiCatalogProductsPhotos({
        id: productId,
        formData: { photos: Array.from(files) as Blob[] },
      })
      onReload()
    } catch {
      setError('Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  const sorted = [...photos].sort((a, b) =>
    a.isMain ? -1 : b.isMain ? 1 : (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        dragging && 'ring-2 ring-primary/50 bg-primary/5',
      )}
      onDragOver={(e: React.DragEvent) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={(e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files.length) void handleUpload(e.dataTransfer.files)
      }}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {sorted.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:opacity-85 transition-opacity cursor-pointer"
          >
            <img
              src={photo.storageUrl ?? noImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {photo.isMain && (
              <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-tight flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Главное
              </div>
            )}
          </button>
        ))}

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
      </div>

      {photos.length === 0 && !dragging && (
        <p className="text-xs text-muted-foreground">
          Перетащите фото или нажмите «Добавить» · JPEG, PNG, WEBP · до 10 МБ
        </p>
      )}
      {dragging && (
        <p className="text-xs text-primary font-medium">Перетащите файлы для загрузки</p>
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

      <ProductPhotoModal
        photo={selectedPhoto}
        productId={productId}
        onClose={() => setSelectedPhoto(null)}
        onDelete={() => {
          onReload()
          setSelectedPhoto(null)
        }}
        onSetMain={() => {
          onReload()
          setSelectedPhoto(null)
        }}
      />
    </div>
  )
}
