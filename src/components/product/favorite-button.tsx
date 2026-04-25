import { Heart } from 'lucide-react'
import type { MouseEvent } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  isFavorite: boolean
  onClick: (e: MouseEvent) => void
}

export function FavoriteButton({ isFavorite, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
      className="relative z-20 shrink-0 w-9 h-9 flex items-center justify-center cursor-pointer"
    >
      <Heart
        className={cn(
          'w-4 h-4 transition-all duration-300',
          isFavorite
            ? 'fill-destructive text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] scale-110'
            : 'text-muted-foreground/60 hover:text-destructive',
        )}
      />
    </button>
  )
}
