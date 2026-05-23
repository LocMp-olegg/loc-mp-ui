import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMediaLightbox, type ChatMediaItem } from './chat-media-lightbox'
import type { AttachmentDto } from '@/api/chat'

function PlayOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
      </div>
    </div>
  )
}

interface ThumbnailProps {
  item: ChatMediaItem
  className?: string
  onClick: () => void
}

function MediaThumbnail({ item, className, onClick }: ThumbnailProps) {
  const isVideo = item.mediaType === 'Video'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('relative overflow-hidden w-full block bg-black/10 cursor-pointer', className)}
    >
      {isVideo ? (
        <>
          <video
            src={item.url}
            className="absolute inset-0 w-full h-full object-cover"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 bg-black/25" />
          <PlayOverlay />
        </>
      ) : (
        <img src={item.url} alt="" className="w-full h-full object-cover" draggable={false} />
      )}
    </button>
  )
}

type GridProps = { items: ChatMediaItem[]; onClick: (i: number) => void }

function OneMedia({ items, onClick }: GridProps) {
  return <MediaThumbnail item={items[0]} className="h-56 w-full" onClick={() => onClick(0)} />
}

function TwoMedia({ items, onClick }: GridProps) {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {items.map((item, i) => (
        <MediaThumbnail key={i} item={item} className="h-44" onClick={() => onClick(i)} />
      ))}
    </div>
  )
}

function ThreeMedia({ items, onClick }: GridProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <MediaThumbnail item={items[0]} className="h-44 w-full" onClick={() => onClick(0)} />
      <div className="grid grid-cols-2 gap-0.5">
        <MediaThumbnail item={items[1]} className="h-32" onClick={() => onClick(1)} />
        <MediaThumbnail item={items[2]} className="h-32" onClick={() => onClick(2)} />
      </div>
    </div>
  )
}

function FourMedia({ items, onClick }: GridProps) {
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {items.map((item, i) => (
        <MediaThumbnail key={i} item={item} className="h-36" onClick={() => onClick(i)} />
      ))}
    </div>
  )
}

function FivePlusMedia({ items, onClick }: GridProps) {
  const extra = items.length - 5
  return (
    <div className="flex flex-col gap-0.5">
      <div className="grid grid-cols-2 gap-0.5">
        {items.slice(0, 2).map((item, i) => (
          <MediaThumbnail key={i} item={item} className="h-40" onClick={() => onClick(i)} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {items.slice(2, 5).map((item, i) => {
          const idx = i + 2
          const isLast = i === 2 && extra > 0
          return (
            <div key={idx} className="relative">
              <MediaThumbnail item={item} className="h-28" onClick={() => onClick(idx)} />
              {isLast && (
                <button
                  type="button"
                  onClick={() => onClick(idx)}
                  className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-lg"
                >
                  +{extra}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface MessageAttachmentsProps {
  attachments: AttachmentDto[]
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const items: ChatMediaItem[] = attachments
    .filter((a): a is AttachmentDto & { url: string } => !!a.url)
    .map((a) => ({ url: a.url, mediaType: a.mediaType, mimeType: a.mimeType }))

  if (items.length === 0) return null

  const count = items.length
  let grid: React.ReactNode
  if (count === 1) grid = <OneMedia items={items} onClick={setLightboxIndex} />
  else if (count === 2) grid = <TwoMedia items={items} onClick={setLightboxIndex} />
  else if (count === 3) grid = <ThreeMedia items={items} onClick={setLightboxIndex} />
  else if (count === 4) grid = <FourMedia items={items} onClick={setLightboxIndex} />
  else grid = <FivePlusMedia items={items} onClick={setLightboxIndex} />

  return (
    <>
      <div className="overflow-hidden">{grid}</div>
      <AnimatePresence>
        {lightboxIndex !== null && (
          <ChatMediaLightbox
            items={items}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
