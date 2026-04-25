import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import type { MouseEvent } from 'react'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'

interface Props {
  quantity: number
  isAvailable: boolean
  maxQuantity?: number
  onAdd: (e: MouseEvent) => void
  onIncrement: (e: MouseEvent) => void
  onDecrement: (e: MouseEvent) => void
}

export function CartControls({
  quantity,
  isAvailable,
  maxQuantity,
  onAdd,
  onIncrement,
  onDecrement,
}: Props) {
  const atMax = maxQuantity !== undefined && quantity >= maxQuantity
  return (
    <AnimatePresence mode="wait" initial={false}>
      {quantity > 0 ? (
        <motion.div
          key="counter"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between w-full rounded-xl bg-muted p-1 h-11 pointer-events-auto shadow-inner"
        >
          <button
            onClick={onDecrement}
            className="h-full aspect-square rounded-lg hover:bg-muted-foreground/10 text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="flex-1 text-center text-sm font-bold text-foreground tabular-nums select-none">
            {quantity}
          </span>

          <button
            onClick={onIncrement}
            aria-label="Увеличить количество"
            disabled={atMax}
            className="h-full aspect-square rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="add"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-auto w-full"
        >
          <ShimmerButton onClick={onAdd} disabled={!isAvailable} className="w-full h-11 px-3 group">
            <div className="flex items-center justify-center w-full gap-2 overflow-hidden">
              <ShoppingCart className="w-4 h-4 shrink-0 transition-transform" />
              <span className="text-sm font-semibold whitespace-nowrap truncate">
                {isAvailable ? 'В корзину' : 'Нет в наличии'}
              </span>
            </div>
          </ShimmerButton>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
