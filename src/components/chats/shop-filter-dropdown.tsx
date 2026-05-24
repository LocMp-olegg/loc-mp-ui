import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/use-click-outside'
import type { ShopDto } from '@/api/catalog'

interface ShopFilterDropdownProps {
  shops: ShopDto[]
  selectedShopId: string | null
  onChange: (shopId: string | null) => void
  unreadByShopId?: Record<string, number>
}

export function ShopFilterDropdown({
  shops,
  selectedShopId,
  onChange,
  unreadByShopId = {},
}: ShopFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside([{ ref, onClose: () => setOpen(false) }])

  const selected = shops.find((s) => s.id === selectedShopId)
  const label = selected?.businessName ?? 'Все магазины'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-colors',
          'bg-white/10 text-nav-text/80 hover:bg-white/15 hover:text-nav-text',
          open && 'bg-white/15',
        )}
      >
        <span className="max-w-28 truncate">{label}</span>
        <ChevronDown
          className={cn('w-3 h-3 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1.5 z-50 min-w-44 rounded-xl border border-white/10 shadow-xl overflow-hidden"
            style={{ background: 'var(--nav-bg)' }}
          >
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors cursor-pointer',
                !selectedShopId
                  ? 'text-primary font-medium bg-primary/10'
                  : 'text-nav-text/80 hover:bg-white/8',
              )}
            >
              <span>Все магазины</span>
              {!selectedShopId && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>

            {shops.map((shop) => {
              const unread = shop.id ? (unreadByShopId[shop.id] ?? 0) : 0
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => {
                    onChange(shop.id ?? null)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors cursor-pointer',
                    selectedShopId === shop.id
                      ? 'text-primary font-medium bg-primary/10'
                      : 'text-nav-text/80 hover:bg-white/8',
                  )}
                >
                  <span className="truncate">{shop.businessName ?? ''}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unread > 0 && (
                      <span className="min-w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                    {selectedShopId === shop.id && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
