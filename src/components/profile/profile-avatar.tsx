import { useRef, useState } from 'react'
import { Camera, User, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { UserProfileDto } from '@/hooks/use-profile'

interface ProfileAvatarProps {
  profile: UserProfileDto
  photoUrl: string | null
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
}

export function ProfileAvatar({ profile, photoUrl, onUpload, onDelete }: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (максимум 5 МБ)')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onUpload(file)
    } catch {
      setError('Не удалось загрузить фото')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await onDelete()
    } catch {
      setError('Не удалось удалить фото')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
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
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          aria-label="Изменить фото"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>

        {busy && (
          <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium disabled:opacity-50"
        >
          {profile.hasPhoto ? 'Изменить' : 'Загрузить фото'}
        </button>
        {profile.hasPhoto && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy}
              className="text-destructive hover:text-destructive/80 transition-colors cursor-pointer disabled:opacity-50"
            >
              Удалить
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-destructive text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
