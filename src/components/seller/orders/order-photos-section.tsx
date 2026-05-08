import { PhotosSection } from '@/components/ui/photos-section'
import type { OrderPhotoDto } from '@/api/orders'

interface OrderPhotosSectionProps {
  photos: OrderPhotoDto[]
  busy: boolean
  onUpload: (files: Blob[]) => Promise<void>
  onDelete: (photoId: string) => Promise<void>
}

export function OrderPhotosSection({ photos, busy, onUpload, onDelete }: OrderPhotosSectionProps) {
  return (
    <PhotosSection
      photos={photos}
      busy={busy}
      modalTitle="Фото заказа"
      onUpload={onUpload}
      onDelete={onDelete}
    />
  )
}
