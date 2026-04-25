import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import type { MouseEvent } from 'react'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'

interface Props {
  quantity: number
  isAvailable: boolean
  onAdd: (e: MouseEvent) => void
  onIncrement: (e: MouseEvent) => void
  onDecrement: (e: MouseEvent) => void
}

export function CartControls({ quantity, isAvailable, onAdd, onIncrement, onDecrement }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {quantity > 0 ? (
        <motion.div
          key="counter"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between w-full rounded-xl bg-muted px-1 h-11 pointer-events-auto"
        >
          <button
            onClick={onDecrement}
            aria-label="Уменьшить количество"
            className="w-9 h-9 rounded-lg hover:bg-muted-foreground/10 text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-foreground tabular-nums">{quantity}</span>
          <button
            onClick={onIncrement}
            aria-label="Увеличить количество"
            className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
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
          className="pointer-events-auto"
        >
          <ShimmerButton
            onClick={onAdd}
            disabled={!isAvailable}
            aria-label="Добавить в корзину"
            className="w-full h-11 text-sm font-semibold"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isAvailable ? 'В корзину' : 'Нет в наличии'}
          </ShimmerButton>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
