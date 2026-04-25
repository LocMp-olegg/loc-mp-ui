import { Star } from 'lucide-react'

interface Props {
  rating: number
  reviewCount: number
}

export function RatingBadge({ rating, reviewCount }: Props) {
  return (
    <div className="inline-flex items-center gap-1 bg-black/5 dark:bg-white/5 backdrop-blur-sm px-1.5 py-0.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <span className="text-xs font-bold text-foreground">{rating}</span>
      <span className="text-xs text-muted-foreground font-medium">({reviewCount})</span>
    </div>
  )
}
