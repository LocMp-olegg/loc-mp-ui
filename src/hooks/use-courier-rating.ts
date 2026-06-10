import { useState, useEffect } from 'react'
import { fetchCourierRating } from '@/lib/reviews'
import type { RatingAggregateDto } from '@/api/reviews'

export function useCourierRating(courierId: string | null | undefined) {
  const [aggregate, setAggregate] = useState<RatingAggregateDto | null>(null)

  useEffect(() => {
    if (!courierId) return
    let cancelled = false
    fetchCourierRating(courierId)
      .then((data) => {
        if (!cancelled) setAggregate(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [courierId])

  return aggregate
}
