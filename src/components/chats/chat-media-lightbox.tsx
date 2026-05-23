import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTouchSwipe } from '@/hooks/use-touch-swipe'
import type { MediaType } from '@/api/chat'

export interface ChatMediaItem {
  url: string
  mediaType: MediaType | undefined
  mimeType?: string | null
}

interface ChatMediaLightboxProps {
  items: ChatMediaItem[]
  initialIndex?: number
  onClose: () => void
}

function VideoPlayer({ item }: { item: ChatMediaItem }) {
  return (
    <video
      src={item.url}
      controls
      autoPlay
      className="max-w-[90vw] max-h-[85vh] rounded-xl"
      onClick={(e) => e.stopPropagation()}
    />
  )
}

function ImageViewer({ item }: { item: ChatMediaItem }) {
  return (
    <motion.img
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      src={item.url}
      alt=""
      className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl select-none"
      onClick={(e) => e.stopPropagation()}
      draggable={false}
    />
  )
}

export function ChatMediaLightbox({ items, initialIndex = 0, onClose }: ChatMediaLightboxProps) {
  const [current, setCurrent] = useState(initialIndex)
  const containerRef = useRef<HTMLDivElement>(null)

  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + items.length) % items.length),
    [items.length],
  )
  const next = useCallback(() => setCurrent((i) => (i + 1) % items.length), [items.length])

  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchSwipe({
    onSwipeLeft: next,
    onSwipeRight: prev,
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  useEffect(() => {
    const el = containerRef.current
    if (!el || items.length <= 1) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [items.length, onTouchStart, onTouchMove, onTouchEnd])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  const item = items[current]

  return createPortal(
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[300] bg-black/92 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Закрыть"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {items.length > 1 && (
        <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums select-none">
          {current + 1} / {items.length}
        </span>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <div key={current} className="flex items-center justify-center">
          {item?.mediaType === 'Video' ? <VideoPlayer item={item} /> : <ImageViewer item={item} />}
        </div>
      </AnimatePresence>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Предыдущее"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Следующее"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </motion.div>,
    document.body,
  )
}
