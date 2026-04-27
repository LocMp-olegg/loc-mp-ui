import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Images } from 'lucide-react'
import { PhotoLightbox } from '@/components/ui/photo-lightbox'

interface Props {
  photos: string[]
  shopName: string
  onClose: () => void
}

export function ShopGalleryModal({ photos, shopName, onClose }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return createPortal(
    <>
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
          className="dark w-full max-w-3xl max-h-[90dvh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col"
          style={{ background: 'color-mix(in srgb, var(--nav-bg) 75%, transparent)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <Images className="w-4 h-4 text-accent" />
              <div>
                <h2 className="font-semibold text-nav-text leading-tight">Фото магазина</h2>
                <p className="text-xs text-nav-text/50 mt-0.5">
                  {shopName} · {photos.length} фото
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 text-nav-text/60" />
            </button>
          </div>

          {/* Photo grid */}
          <div className="overflow-y-auto overflow-x-hidden p-4 scrollbar-thin">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/25 hover:opacity-90 transition-all cursor-pointer"
                >
                  <img
                    src={photo}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox renders above the gallery modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={photos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>,
    document.body,
  )
}
