import { useState, useMemo } from 'react'
import { useMyShops } from '@/hooks/use-my-shops'
import { useChats } from '@/hooks/use-chats'
import { ChatsList } from '@/components/chats/chats-list'
import { ShopFilterDropdown } from '@/components/chats/shop-filter-dropdown'

export function SellerChatsPage() {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)

  const { shops } = useMyShops()
  const { chats, loading, error, hasMore, loadMore } = useChats({ type: 'Shop' })

  const displayed = useMemo(
    () => (selectedShopId ? chats.filter((c) => c.referenceId === selectedShopId) : chats),
    [chats, selectedShopId],
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 gap-3">
        <h1 className="text-2xl font-bold text-foreground">Чаты магазина</h1>
        {shops.length > 0 && (
          <ShopFilterDropdown
            shops={shops}
            selectedShopId={selectedShopId}
            onChange={setSelectedShopId}
          />
        )}
      </div>

      <ChatsList
        chats={displayed}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        backTo="/seller/chats"
      />
    </div>
  )
}
