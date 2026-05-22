import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import noImageUrl from '@/assets/no-image-available.jpg'
import type { ShopPin } from '@/hooks/use-shops-map'

export function ShopPinPopup({ pin }: { pin: ShopPin }) {
  return (
    <div className="w-52">
      <div className="flex items-center gap-3 p-3 pb-2">
        <img
          src={pin.photo ?? noImageUrl}
          alt={pin.name}
          className="w-14 min-h-14 rounded-lg object-cover shrink-0 bg-muted"
        />
        <p className="flex-1 min-w-0 font-semibold text-sm text-foreground line-clamp-3 break-words">
          {pin.name}
        </p>
      </div>

      <div className="flex items-center gap-1.5 px-3 pb-3">
        {pin.reviewCount > 0 ? (
          <>
            <Star className="w-3 h-3 fill-accent text-accent shrink-0" />
            <span className="text-xs text-muted-foreground">
              {pin.rating.toFixed(1)} · {pin.reviewCount} отз.
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground/50">Нет отзывов</span>
        )}
      </div>

      <div className="border-t border-border/60">
        <Link
          to={`/shop/${pin.shopId}`}
          className="block text-center py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Перейти в магазин →
        </Link>
      </div>
    </div>
  )
}
