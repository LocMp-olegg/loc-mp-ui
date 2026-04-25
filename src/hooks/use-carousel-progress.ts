import { useState, useEffect } from 'react'
import type { CarouselApi } from '@/components/ui/carousel'

interface CarouselProgress {
  scrollProgress: number
  canScrollPrev: boolean
  canScrollNext: boolean
}

export function useCarouselProgress(api: CarouselApi | undefined): CarouselProgress {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (!api) return
    const update = () => {
      setScrollProgress(api.scrollProgress())
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }
    api.on('scroll', update)
    api.on('reInit', update)
    api.on('select', update)
    return () => {
      api.off('scroll', update)
      api.off('select', update)
    }
  }, [api])

  return { scrollProgress, canScrollPrev, canScrollNext }
}
