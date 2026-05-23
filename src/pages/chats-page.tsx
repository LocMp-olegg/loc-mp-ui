import { useState, useMemo } from 'react'
import { Headphones } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useChats } from '@/hooks/use-chats'
import { useMyShops } from '@/hooks/use-my-shops'
import { useStartChat } from '@/hooks/use-start-chat'
import { hasRole } from '@/lib/utils'
import { ChatTabBar, type ChatsTab } from '@/components/chats/chat-tab-bar'
import { ChatsList } from '@/components/chats/chats-list'

export function ChatsPage() {
  const { user } = useAuth()
  const isSeller = hasRole(user?.role ?? [], 'Seller')
  const isAdmin = hasRole(user?.role ?? [], 'Admin')
  const canContactSupport = !!user && !isAdmin

  const [activeTab, setActiveTab] = useState<ChatsTab>('my')
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)

  const { shops } = useMyShops()
  const { startChat, loading: startingChat } = useStartChat()

  const { chats, loading, error, hasMore, loadMore } = useChats({
    type: activeTab === 'shop' ? 'Shop' : undefined,
    isSupport: activeTab === 'support',
  })

  const displayedChats = useMemo(() => {
    if (activeTab === 'shop' && selectedShopId) {
      return chats.filter((c) => c.referenceId === selectedShopId)
    }
    return chats
  }, [chats, activeTab, selectedShopId])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground">Чаты</h1>
        {canContactSupport && (
          <button
            type="button"
            disabled={startingChat}
            onClick={() => startChat({ type: 'Support' }, '/chats')}
            className="inline-flex items-center gap-1.5 text-sm text-primary border border-primary/30 hover:border-primary/70 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Headphones className="w-3.5 h-3.5" />
            Поддержка
          </button>
        )}
      </div>

      <ChatTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSelectedShopId(null)
        }}
        isSeller={isSeller}
        isAdmin={isAdmin}
        shops={shops}
        selectedShopId={selectedShopId}
        onShopChange={setSelectedShopId}
      />

      <ChatsList
        chats={displayedChats}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        currentUserId={user?.id}
      />
    </div>
  )
}
