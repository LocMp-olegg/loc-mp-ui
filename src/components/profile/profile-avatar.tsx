import { useState } from 'react'
import { Camera, User } from 'lucide-react'
import type { UserProfileDto } from '@/hooks/use-profile'
import { PhotoEditorModal } from './photo-editor-modal'

interface ProfileAvatarProps {
  profile: UserProfileDto
  photoUrl: string | null
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
}

export function ProfileAvatar({ profile, photoUrl, onUpload, onDelete }: ProfileAvatarProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 cursor-pointer self-center sm:self-auto"
        aria-label="Изменить фото профиля"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={profile.userName ?? 'Аватар'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>

        {/* Camera badge */}
        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-3 h-3 text-primary-foreground" />
        </div>
      </button>

      <PhotoEditorModal
        open={modalOpen}
        hasPhoto={profile.hasPhoto}
        photoUrl={photoUrl}
        userName={profile.userName}
        onClose={() => setModalOpen(false)}
        onUpload={onUpload}
        onDelete={onDelete}
      />
    </>
  )
}
