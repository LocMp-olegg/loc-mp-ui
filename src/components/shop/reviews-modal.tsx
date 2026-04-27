import { createPortal } from 'react-dom'

import { motion } from 'framer-motion'

import { X, MessageSquare } from 'lucide-react'

import { ProductReviews } from '@/components/product/product-reviews'

import { useShopReviews } from '@/hooks/use-shop-reviews'

import type { RatingAggregateDto } from '@/api/reviews'

interface Props {
  sellerId: string

  shopName: string

  aggregate: RatingAggregateDto | null

  onClose: () => void
}

export function ShopReviewsModal({ sellerId, shopName, aggregate, onClose }: Props) {
  const reviewsState = useShopReviews(sellerId)

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-200 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[85dvh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col"
        style={{ background: 'color-mix(in srgb, var(--background) 85%, transparent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground leading-tight">Отзывы о магазине</h2>

              <p className="text-xs text-muted-foreground mt-0.5">{shopName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto overflow-x-hidden px-5 py-5">
          <ProductReviews aggregate={aggregate} {...reviewsState} />
        </div>
      </motion.div>
    </motion.div>,

    document.body,
  )
}
