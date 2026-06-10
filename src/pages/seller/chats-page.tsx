import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMyShops } from '@/hooks/use-my-shops'
import { useChats } from '@/hooks/use-chats'
import { ChatsList } from '@/components/chats/chats-list'
import { ShopFilterDropdown } from '@/components/chats/shop-filter-dropdown'
import { SwitchTabs } from '@/components/ui/switch-tabs'
import { tabSlideVariants } from '@/lib/tab-variants'

type ChatsTab = 'shop' | 'orders'

const TABS = [
  { key: 'shop', label: 'Магазин' },
  { key: 'orders', label: 'Заказы' },
] as const

const TAB_ORDER: ChatsTab[] = ['shop', 'orders']

export function SellerChatsPage() {
  const [tab, setTab] = useState<ChatsTab>('shop')
  const [direction, setDirection] = useState(0)
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)

  const handleTabChange = (next: ChatsTab) => {
    if (next === tab) return
    setDirection(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? 1 : -1)
    setTab(next)
  }

  const { shops } = useMyShops()
  const { chats, loading, error, hasMore, loadMore } = useChats({
    type: tab === 'shop' ? 'Shop' : 'Order',
  })

  const displayed = useMemo(
    () => (tab === 'shop' && selectedShopId ? chats.filter((c) => c.referenceId === selectedShopId) : chats),
    [chats, selectedShopId, tab],
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 gap-3">
        <h1 className="text-2xl font-bold text-foreground">Чаты</h1>
        {tab === 'shop' && shops.length > 0 && (
          <ShopFilterDropdown
            shops={shops}
            selectedShopId={selectedShopId}
            onChange={setSelectedShopId}
          />
        )}
      </div>

      <SwitchTabs
        tabs={TABS}
        active={tab}
        onChange={handleTabChange}
        layoutId="seller-chats-tab"
        className="mb-5"
      />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={tab}
            custom={direction}
            variants={tabSlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ChatsList
              chats={displayed}
              loading={loading}
              error={error}
              hasMore={hasMore}
              onLoadMore={loadMore}
              backTo="/seller/chats"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
