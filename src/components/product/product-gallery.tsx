import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const SWIPE_THRESHOLD = 40

interface Props {
  images: string[]
  alt: string
}

export function ProductGallery({ images, alt }: Props) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontal.current = null
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (isHorizontal.current === null) isHorizontal.current = dx > dy
    if (isHorizontal.current) e.preventDefault()
  }, [])

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!isHorizontal.current) return
      const delta = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(delta) < SWIPE_THRESHOLD) return
      if (delta < 0) next()
      else prev()
    },
    [next, prev],
  )

  useEffect(() => {
    const el = mainRef.current
    if (!el || images.length <= 1) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [images.length, handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        ref={mainRef}
        className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted"
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
              onClick={prev}
              aria-label="Предыдущее фото"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
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
    </div>
  )
}
