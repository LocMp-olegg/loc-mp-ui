import { useRef, useCallback } from 'react'

interface Options {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}

export function useTouchSwipe({ onSwipeLeft, onSwipeRight, threshold = 40 }: Options) {
  const startX = useRef(0)
  const startY = useRef(0)
  const horizontal = useRef<boolean | null>(null)

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    horizontal.current = null
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - startX.current)
    const dy = Math.abs(e.touches[0].clientY - startY.current)
    if (horizontal.current === null) horizontal.current = dx > dy
    if (horizontal.current) e.preventDefault()
  }, [])

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!horizontal.current) return
      const delta = e.changedTouches[0].clientX - startX.current
      if (Math.abs(delta) < threshold) return
      if (delta < 0) onSwipeLeft()
      else onSwipeRight()
    },
    [onSwipeLeft, onSwipeRight, threshold],
  )

  return { onTouchStart, onTouchMove, onTouchEnd }
}
