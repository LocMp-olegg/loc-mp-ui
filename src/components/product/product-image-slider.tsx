import { useState, useCallback, useRef, useEffect } from 'react'

interface Props {
  images: string[]
  alt: string
}

const SWIPE_THRESHOLD = 30

export function ProductImageSlider({ images, alt }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (images.length <= 1) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const index = Math.min(Math.floor((x / rect.width) * images.length), images.length - 1)
      setCurrentIndex(index)
    },
    [images.length],
  )

  const handleMouseLeave = useCallback(() => {
    setCurrentIndex(0)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontal.current = null
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (images.length <= 1 || !isHorizontal.current) return
      const delta = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(delta) < SWIPE_THRESHOLD) return
      setCurrentIndex((prev) =>
        delta < 0 ? (prev + 1) % images.length : (prev - 1 + images.length) % images.length,
      )
    },
    [images.length],
  )

  // Non-passive touchmove so we can preventDefault on horizontal swipes,
  // stopping the parent horizontal scroll from firing simultaneously.
  useEffect(() => {
    const el = containerRef.current
    if (!el || images.length <= 1) return

    const onTouchMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)

      if (isHorizontal.current === null) {
        isHorizontal.current = dx > dy
      }

      if (isHorizontal.current) {
        e.preventDefault()
      }
    }

    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [images.length])

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-square bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Нет фото</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square bg-muted overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : `${alt} — фото ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
            i === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          loading={i === 0 ? 'eager' : 'lazy'}
          draggable={false}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
          {images.map((_, i) => (
            <span
              key={i}
              className={`block h-1 rounded-full transition-all duration-150 ${
                i === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
