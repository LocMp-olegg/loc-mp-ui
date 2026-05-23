import { useState, useEffect, useReducer } from 'react'
import { AnimatePresence } from 'framer-motion'
import { X, Film, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMediaLightbox, type ChatMediaItem } from './chat-media-lightbox'

interface AttachmentPreviewsProps {
  files: File[]
  onRemove: (index: number) => void
}

interface Preview {
  url: string
  name: string
  isVideo: boolean
}

function usePreviews(files: File[]): Preview[] {
  const [previews, dispatch] = useReducer((_: Preview[], next: Preview[]) => next, [])

  useEffect(() => {
    const urls: string[] = []
    const next: Preview[] = files.map((f) => {
      const url = URL.createObjectURL(f)
      urls.push(url)
      return { url, name: f.name, isVideo: f.type.startsWith('video/') }
    })
    dispatch(next)
    return () => urls.forEach(URL.revokeObjectURL)
  }, [files])

  return previews
}

export function AttachmentPreviews({ files, onRemove }: AttachmentPreviewsProps) {
  const previews = usePreviews(files)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (previews.length === 0) return null

  const lightboxItems: ChatMediaItem[] = previews.map((p, i) => ({
    url: p.url,
    mediaType: p.isVideo ? 'Video' : 'Image',
    mimeType: files[i]?.type,
  }))

  return (
    <>
      <div className="flex gap-2 px-4 pt-2 pb-1 overflow-x-auto">
        {previews.map((preview, i) => (
          <div key={i} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setLightboxIndex(i)}
              className={cn(
                'w-16 h-16 rounded-xl overflow-hidden border border-border/50',
                'bg-muted flex items-center justify-center cursor-pointer',
                'hover:opacity-80 transition-opacity',
              )}
            >
              {preview.isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Film className="w-6 h-6 text-muted-foreground" />
                  <Play className="absolute w-4 h-4 text-primary opacity-70" />
                </div>
              ) : (
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(i)
              }}
              aria-label="Удалить"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors z-10"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <ChatMediaLightbox
            items={lightboxItems}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
