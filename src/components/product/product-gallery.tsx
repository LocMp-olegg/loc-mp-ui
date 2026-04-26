import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'
import { useTouchSwipe } from '@/hooks/use-touch-swipe'

interface Props {
  images: string[]
  alt: string
}

export function ProductGallery({ images, alt }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length])

  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchSwipe({
    onSwipeLeft: next,
    onSwipeRight: prev,
  })

  useEffect(() => {
    const el = mainRef.current
    if (!el || images.length <= 1) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [images.length, onTouchStart, onTouchMove, onTouchEnd])

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        ref={mainRef}
        className="relative aspect-square w-full max-h-[420px] rounded-2xl overflow-hidden bg-muted cursor-pointer"
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={images[current]}
          alt={`${alt} — фото ${current + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              aria-label="Предыдущее фото"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              aria-label="Следующее фото"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'block h-1.5 rounded-full transition-all duration-200',
                    i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setCurrent(i)}
              aria-label={`Фото ${i + 1}`}
              className={cn(
                'shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                i === current
                  ? 'border-primary'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightboxOpen && (
          <PhotoLightbox
            photos={images}
            initialIndex={current}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
