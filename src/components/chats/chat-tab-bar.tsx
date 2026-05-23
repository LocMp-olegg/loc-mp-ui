import { cn } from '@/lib/utils'
import { ShopFilterDropdown } from './shop-filter-dropdown'
import type { ShopDto } from '@/api/catalog'

export type ChatsTab = 'my' | 'shop' | 'support'

interface ChatTabBarProps {
  activeTab: ChatsTab
  onTabChange: (tab: ChatsTab) => void
  isSeller: boolean
  isAdmin: boolean
  shops: ShopDto[]
  selectedShopId: string | null
  onShopChange: (shopId: string | null) => void
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-foreground/60 hover:text-foreground hover:bg-muted/50',
      )}
    >
      {children}
    </button>
  )
}

export function ChatTabBar({
  activeTab,
  onTabChange,
  isSeller,
  isAdmin,
  shops,
  selectedShopId,
  onShopChange,
}: ChatTabBarProps) {
  const showShopTab = isSeller
  const showSupportTab = isAdmin
  const multiTab = showShopTab || showSupportTab

  if (!multiTab) return null

  return (
    <div className="flex items-center gap-1 mb-4 flex-wrap">
      <TabButton active={activeTab === 'my'} onClick={() => onTabChange('my')}>
        Мои чаты
      </TabButton>

      {showShopTab && (
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-xl transition-colors',
            activeTab === 'shop' ? 'bg-primary/15' : 'hover:bg-muted/50',
          )}
        >
          <button
            type="button"
            onClick={() => onTabChange('shop')}
            className={cn(
              'text-sm font-medium transition-colors',
              activeTab === 'shop' ? 'text-primary' : 'text-foreground/60 hover:text-foreground',
            )}
          >
            Магазин
          </button>
          {shops.length > 1 && activeTab === 'shop' && (
            <ShopFilterDropdown
              shops={shops}
              selectedShopId={selectedShopId}
              onChange={onShopChange}
            />
          )}
          {shops.length === 1 && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-md truncate max-w-28',
                activeTab === 'shop'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {shops[0]?.businessName}
            </span>
          )}
        </div>
      )}

      {showSupportTab && (
        <TabButton active={activeTab === 'support'} onClick={() => onTabChange('support')}>
          Поддержка
        </TabButton>
      )}
    </div>
  )
}
