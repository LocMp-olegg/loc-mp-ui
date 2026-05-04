import { useState } from 'react'
import { Store, Camera } from 'lucide-react'
import { ShopsService } from '@/api/catalog'
import { PhotoEditorModal } from '@/components/profile/photo-editor-modal'

interface ShopAvatarSectionProps {
  shopId: string
  avatarUrl: string | null | undefined
  businessName: string
  onUpdate: (url: string) => void
}

export function ShopAvatarSection({ shopId, avatarUrl, businessName, onUpdate }: ShopAvatarSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setError(null)
    const updated = await ShopsService.postApiCatalogShopsAvatar({
      id: shopId,
      formData: { image: file },
    })
    if (updated.avatarUrl) onUpdate(updated.avatarUrl)
  }

  return (
    <>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border cursor-pointer shrink-0"
          aria-label="Изменить аватар магазина"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Аватар магазина" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">Аватар магазина</p>
          <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP · до 5 МБ</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer mt-1"
          >
            {avatarUrl ? 'Заменить' : 'Загрузить'}
          </button>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      </div>
      <PhotoEditorModal
        open={modalOpen}
        hasPhoto={!!avatarUrl}
        photoUrl={avatarUrl ?? null}
        userName={businessName || null}
        title="Аватар магазина"
        onClose={() => setModalOpen(false)}
        onUpload={async (file) => {
          try {
            await handleUpload(file)
          } catch {
            setError('Не удалось загрузить аватар')
            throw new Error('upload failed')
          }
        }}
      />
    </>
  )
}
