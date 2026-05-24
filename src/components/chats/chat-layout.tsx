import React, { useState, useReducer, useCallback, useMemo, useEffect, useRef } from 'react'
import { Outlet, useMatch, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Headphones, MessageSquare, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useChats } from '@/hooks/use-chats'
import { useMyShops } from '@/hooks/use-my-shops'
import { useChatContext } from '@/contexts/chat-context'
import { hasRole, cn } from '@/lib/utils'
import { ChatTabBar, type ChatsTab } from './chat-tab-bar'
import { ChatListSkeleton } from './chat-list-skeleton'
import { ChatTypeAvatar } from './chat-type-avatar'
import { chatTitle, formatChatTime } from '@/lib/chats'
import { ChatsService } from '@/api/chat'
import type { ChatSummaryDto } from '@/api/chat'

const MIN_W = 240
const MAX_W = 520
const DEFAULT_W = 300

function storedWidth(): number {
  try {
    const v = localStorage.getItem('chat-sidebar-width')
    if (v) return Math.max(MIN_W, Math.min(MAX_W, parseInt(v)))
  } catch {
    /* ignore */
  }
  return DEFAULT_W
}

function ChatPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 opacity-40" />
      </div>
      <p className="text-sm">Выберите чат для начала общения</p>
    </div>
  )
}

interface SidebarItemProps {
  chat: ChatSummaryDto
  currentUserId?: string
  active: boolean
}

function SidebarChatItem({ chat, currentUserId, active }: SidebarItemProps) {
  const title = chatTitle(chat, currentUserId)
  const time = formatChatTime(chat.lastMessageAt)
  const unread = chat.unreadCount ?? 0
  const isClosed = chat.status === 'Closed'

  return (
    <Link
      to={`/chats/${chat.id}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
        active ? 'bg-primary/15 text-foreground' : 'hover:bg-muted/50 text-foreground',
        unread > 0 && !active && 'bg-card/50',
      )}
    >
      <ChatTypeAvatar type={chat.type} className="w-10 h-10 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn('text-sm truncate', unread > 0 ? 'font-semibold' : 'font-medium')}>
            {title}
          </span>
          {time && (
            <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{time}</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          {isClosed ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <XCircle className="w-3 h-3 shrink-0" />
              Закрыт
            </span>
          ) : !chat.lastMessageAt ? (
            <span className="text-[11px] text-muted-foreground italic">Нет сообщений</span>
          ) : (
            <span className="text-[11px] text-muted-foreground truncate"></span>
          )}
          {unread > 0 && (
            <span className="min-w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

type BadgesAction =
  | { type: 'set'; tab: 'my' | 'shop'; value: number }
  | { type: 'increment'; tab: 'my' | 'shop' }

function badgesReducer(
  state: { my: number; shop: number },
  action: BadgesAction,
): { my: number; shop: number } {
  switch (action.type) {
    case 'set':
      return { ...state, [action.tab]: action.value }
    case 'increment':
      return { ...state, [action.tab]: state[action.tab] + 1 }
  }
}

export function ChatLayout() {
  const { user } = useAuth()
  const isSeller = hasRole(user?.role ?? [], 'Seller')
  const isAdmin = hasRole(user?.role ?? [], 'Admin')
  const canContactSupport = !!user && !isAdmin

  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ChatsTab>('my')
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(storedWidth)
  const [showSupportConfirm, setShowSupportConfirm] = useState(false)
  const [tabBadges, dispatchBadges] = useReducer(badgesReducer, { my: 0, shop: 0 })
  const chatTabCacheRef = useRef<Map<string, ChatsTab>>(new Map())

  const { shops } = useMyShops()
  const {
    chats,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
    softReload,
    updateChatUnread,
    touchChat,
  } = useChats({
    type: activeTab === 'shop' ? 'Shop' : undefined,
    isSupport: activeTab === 'support',
  })
  const { onMessageReceived, supportUnreadCount, decrementSupportUnreadCount } = useChatContext()

  const chatMatch = useMatch('/chats/:id')
  const activeChatId = chatMatch?.params.id !== 'new' ? chatMatch?.params.id : undefined
  const hasActiveChat = !!chatMatch

  const chatsRef = useRef(chats)
  useEffect(() => {
    chatsRef.current = chats
  })

  useEffect(() => {
    if (!isSeller) return
    ChatsService.getApiChatsChats({ type: 'Shop', pageSize: 100 })
      .then((r) => {
        const total = (r.items ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
        r.items?.forEach((c) => {
          if (c.id) chatTabCacheRef.current.set(c.id, 'shop')
        })
        dispatchBadges({ type: 'set', tab: 'shop', value: total })
      })
      .catch(() => {})
  }, [isSeller])

  useEffect(() => {
    chats.forEach((c) => {
      if (!c.id) return
      const tab: ChatsTab = c.type === 'Shop' ? 'shop' : c.type === 'Support' ? 'support' : 'my'
      chatTabCacheRef.current.set(c.id, tab)
    })
    if (!loading && (activeTab === 'my' || activeTab === 'shop')) {
      const filtered =
        isAdmin && activeTab === 'my' ? chats.filter((c) => c.type !== 'Support') : chats
      const total = filtered.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
      dispatchBadges({ type: 'set', tab: activeTab as 'my' | 'shop', value: total })
    }
  }, [chats, loading, activeTab, isAdmin])

  useEffect(() => {
    if (!activeChatId) return
    const unread = chatsRef.current.find((c) => c.id === activeChatId)?.unreadCount ?? 0
    if (unread > 0) updateChatUnread(activeChatId, -unread)
  }, [activeChatId, updateChatUnread])

  useEffect(() => {
    if (!activeChatId || loading) return
    if (!chatsRef.current.some((c) => c.id === activeChatId)) {
      reload()
    }
  }, [activeChatId, loading, reload])

  useEffect(() => {
    return onMessageReceived((msg) => {
      if (!msg.chatId) return
      if (msg.sentAt) touchChat(msg.chatId, msg.sentAt)
      const isKnown = chatsRef.current.some((c) => c.id === msg.chatId)
      if (msg.chatId !== activeChatId) {
        updateChatUnread(msg.chatId, 1)
        const msgTab = chatTabCacheRef.current.get(msg.chatId)
        if (msgTab && msgTab !== activeTab && msgTab !== 'support') {
          dispatchBadges({ type: 'increment', tab: msgTab })
        }
        if (!isKnown && !msgTab) {
          softReload()
        }
      }
    })
  }, [onMessageReceived, activeChatId, updateChatUnread, touchChat, activeTab, softReload])

  const shopUnreadByShopId = useMemo(() => {
    const map: Record<string, number> = {}
    chats.forEach((c) => {
      if (c.type === 'Shop' && c.referenceId) {
        map[c.referenceId] = (map[c.referenceId] ?? 0) + (c.unreadCount ?? 0)
      }
    })
    return map
  }, [chats])

  const displayedChats = useMemo(() => {
    let result = chats
    if (isAdmin && activeTab === 'my') {
      result = result.filter((c) => c.type !== 'Support')
    }
    if (activeTab === 'shop' && selectedShopId) {
      result = result.filter((c) => c.referenceId === selectedShopId)
    }
    if (activeChatId) {
      result = result.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c))
    }
    return result
  }, [chats, isAdmin, activeTab, selectedShopId, activeChatId])

  const handleResizeDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = panelWidth

      const onMove = (ev: MouseEvent) => {
        const w = Math.max(MIN_W, Math.min(MAX_W, startW + ev.clientX - startX))
        setPanelWidth(w)
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        setPanelWidth((w) => {
          localStorage.setItem('chat-sidebar-width', String(w))
          return w
        })
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [panelWidth],
  )

  return (
    <div
      className="flex h-[calc(100dvh-3.5rem)] overflow-hidden"
      style={{ '--sidebar-w': `${panelWidth}px` } as React.CSSProperties}
    >
      {/* ── Left panel ── */}
      <div
        className={cn(
          'flex flex-col border-r border-border/50 shrink-0',
          'bg-card/30 backdrop-blur-sm',
          hasActiveChat
            ? 'hidden md:flex md:w-[var(--sidebar-w)]'
            : 'flex w-full md:w-[var(--sidebar-w)]',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <h1 className="text-base font-semibold text-foreground">Чаты</h1>
          {canContactSupport && (
            <button
              type="button"
              onClick={() => setShowSupportConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs text-primary border border-primary/30 hover:border-primary/60 hover:bg-primary/5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Headphones className="w-3 h-3" />
              Поддержка
            </button>
          )}
        </div>

        {/* Tabs */}
        {(isSeller || isAdmin) && (
          <div className="px-2 pt-2 shrink-0">
            <ChatTabBar
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab)
                setSelectedShopId(null)
                if (tab === 'support') decrementSupportUnreadCount(supportUnreadCount)
              }}
              isSeller={isSeller}
              isAdmin={isAdmin}
              shops={shops}
              selectedShopId={selectedShopId}
              onShopChange={setSelectedShopId}
              myUnread={activeTab !== 'my' ? tabBadges.my : 0}
              shopUnread={activeTab !== 'shop' ? tabBadges.shop : 0}
              supportUnread={activeTab !== 'support' ? supportUnreadCount : 0}
              shopUnreadByShopId={shopUnreadByShopId}
            />
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading && chats.length === 0 ? (
            <div className="px-2">
              <ChatListSkeleton />
            </div>
          ) : error ? (
            <p className="text-xs text-destructive px-4 py-4 text-center">{error}</p>
          ) : displayedChats.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-8 text-center">Нет чатов</p>
          ) : (
            <div className="px-2 space-y-0.5">
              {displayedChats.map((chat) => (
                <SidebarChatItem
                  key={chat.id}
                  chat={chat}
                  currentUserId={user?.id}
                  active={chat.id === activeChatId}
                />
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-2 text-xs text-primary hover:bg-primary/5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Загрузка…' : 'Показать ещё'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Resize handle (desktop only) ── */}
      <div
        className="hidden md:block w-[3px] shrink-0 cursor-col-resize group relative select-none"
        onMouseDown={handleResizeDown}
      >
        <div className="absolute inset-0 group-hover:bg-primary/40 transition-colors duration-150" />
      </div>

      {/* ── Right panel ── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 overflow-hidden',
          !hasActiveChat && 'hidden md:flex',
        )}
      >
        {hasActiveChat ? <Outlet /> : <ChatPlaceholder />}
      </div>

      {/* ── Support confirm dialog ── */}
      <AnimatePresence>
        {showSupportConfirm && (
          <motion.div
            key="support-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSupportConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-card border border-border rounded-2xl shadow-xl p-5 mx-4 w-full max-w-xs flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-foreground">Написать в поддержку</p>
                <p className="text-xs text-muted-foreground">
                  Хотите начать новый чат с командой поддержки?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupportConfirm(false)}
                  className="flex-1 h-9 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupportConfirm(false)
                    navigate('/chats/new', { state: { type: 'Support', backTo: '/chats' } })
                  }}
                  className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  Написать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
