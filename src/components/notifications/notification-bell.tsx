import React, { useReducer, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useMatch } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, Check, CheckCheck, Loader2, X } from 'lucide-react'
import { NotificationsService } from '@/api/notifications'
import type { NotificationDto } from '@/api/notifications'
import {
  NOTIFICATION_LABELS,
  CATEGORY_DOT_COLORS,
  notificationCategory,
  notificationLink,
} from '@/lib/notifications'
import { useNotificationHub } from '@/hooks/use-notification-hub'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

function notifChatId(n: NotificationDto): string | null {
  const p = n.payload as Record<string, unknown> | null | undefined
  if (!p || typeof p !== 'object') return null
  return typeof p.chatId === 'string' ? p.chatId : null
}

const POLL_MS = 60_000
const DROPDOWN_SIZE = 5
const TOAST_DURATION = 5000

interface BellState {
  unreadCount: number
  items: NotificationDto[]
  loadingItems: boolean
  open: boolean
  toast: NotificationDto | null
}

type BellAction =
  | { type: 'set_count'; count: number }
  | { type: 'increment_count' }
  | { type: 'toggle_open' }
  | { type: 'close' }
  | { type: 'items_loaded'; items: NotificationDto[] }
  | { type: 'mark_read'; id: string }
  | { type: 'mark_all_read' }
  | { type: 'show_toast'; notification: NotificationDto }
  | { type: 'hide_toast' }

function bellReducer(state: BellState, action: BellAction): BellState {
  switch (action.type) {
    case 'set_count':
      return { ...state, unreadCount: action.count }
    case 'increment_count':
      return { ...state, unreadCount: state.unreadCount + 1 }
    case 'toggle_open':
      return { ...state, open: !state.open, loadingItems: !state.open }
    case 'close':
      return { ...state, open: false }
    case 'items_loaded':
      return { ...state, items: action.items, loadingItems: false }
    case 'mark_read':
      return {
        ...state,
        items: state.items.map((n) => (n.id === action.id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    case 'mark_all_read':
      return {
        ...state,
        items: state.items.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }
    case 'show_toast':
      return { ...state, toast: action.notification }
    case 'hide_toast':
      return { ...state, toast: null }
  }
}

function NotificationToast({
  notification,
  onDismiss,
  onRead,
}: {
  notification: NotificationDto
  onDismiss: () => void
  onRead: () => void
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, TOAST_DURATION)
    return () => clearTimeout(id)
  }, [onDismiss])

  const cat = notificationCategory(notification.type!)
  const dotColor = CATEGORY_DOT_COLORS[cat]
  const link = notificationLink(notification)

  const inner = (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span className={cn('mt-1 w-2 h-2 rounded-full shrink-0', dotColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-snug">
          {notification.title ?? NOTIFICATION_LABELS[notification.type!]}
        </p>
        {notification.body && (
          <p className="text-xs text-foreground/60 line-clamp-2 mt-0.5 leading-relaxed">
            {notification.body}
          </p>
        )}
        <p className="text-[11px] text-foreground/40 mt-1">
          {notification.createdAt ? timeAgo(notification.createdAt) : 'только что'}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDismiss()
        }}
        className="shrink-0 mt-0.5 p-0.5 rounded-md text-foreground/30 hover:text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Закрыть"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  const base = cn(
    'relative overflow-hidden rounded-2xl shadow-2xl w-80',
    link && 'cursor-pointer hover:brightness-[1.03] active:scale-[0.98] transition-all',
  )
  const style: React.CSSProperties = {
    background: 'color-mix(in srgb, var(--card) 88%, transparent)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.14)',
  }

  return (
    <div className={base} style={style}>
      {link ? (
        <Link
          to={link}
          onClick={() => {
            onRead()
            onDismiss()
          }}
          className="block"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
      {/* countdown bar */}
      <motion.div
        className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-70', dotColor)}
        style={{ originX: 0 }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
      />
    </div>
  )
}

export function NotificationBell({ iconClassName }: { iconClassName?: string }) {
  const [{ unreadCount, items, loadingItems, open, toast }, dispatch] = useReducer(bellReducer, {
    unreadCount: 0,
    items: [],
    loadingItems: false,
    open: false,
    toast: null,
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  })

  const chatMatch = useMatch('/chats/:id')
  const activeChatId = chatMatch?.params.id !== 'new' ? chatMatch?.params.id : undefined
  const activeChatIdRef = useRef(activeChatId)
  useEffect(() => {
    activeChatIdRef.current = activeChatId
  })

  const hideToast = useCallback(() => dispatch({ type: 'hide_toast' }), [])

  const toastRef = useRef(toast)
  useEffect(() => {
    toastRef.current = toast
  })

  const onToastRead = useCallback(() => {
    const n = toastRef.current
    if (!n?.id || n.isRead) return
    dispatch({ type: 'mark_read', id: n.id })
    NotificationsService.postApiNotificationsNotificationsRead({ id: n.id }).catch(() => {})
  }, [])

  const onPush = useCallback(() => {
    NotificationsService.getApiNotificationsNotifications({ page: 1, pageSize: DROPDOWN_SIZE })
      .then((res) => {
        const fetched = res.items ?? []
        const newest = fetched[0]
        // Feature 1: user is already viewing this chat — mark read silently, skip toast/count
        if (newest?.type === 'NewMessage' && notifChatId(newest) === activeChatIdRef.current) {
          if (!newest.isRead && newest.id) {
            NotificationsService.postApiNotificationsNotificationsRead({ id: newest.id }).catch(
              () => {},
            )
          }
          if (openRef.current) dispatch({ type: 'items_loaded', items: fetched })
          return
        }
        dispatch({ type: 'increment_count' })
        if (newest) dispatch({ type: 'show_toast', notification: newest })
        if (openRef.current) dispatch({ type: 'items_loaded', items: fetched })
      })
      .catch(() => {})
  }, [])

  useNotificationHub(onPush)

  const fetchCount = useCallback(() => {
    NotificationsService.getApiNotificationsNotificationsUnreadCount()
      .then((count) => dispatch({ type: 'set_count', count }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, POLL_MS)
    return () => clearInterval(id)
  }, [fetchCount])

  // Feature 2: when user opens a chat, auto-mark any unread NewMessage notifications for it
  useEffect(() => {
    if (!activeChatId) return
    let cancelled = false
    NotificationsService.getApiNotificationsNotifications({ onlyUnread: true, pageSize: 50 })
      .then((res) => {
        if (cancelled) return
        ;(res.items ?? [])
          .filter((n) => n.type === 'NewMessage' && notifChatId(n) === activeChatId)
          .forEach((n) => {
            if (!n.id) return
            dispatch({ type: 'mark_read', id: n.id })
            NotificationsService.postApiNotificationsNotificationsRead({ id: n.id }).catch(() => {})
          })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [activeChatId])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) dispatch({ type: 'close' })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    NotificationsService.getApiNotificationsNotifications({ page: 1, pageSize: DROPDOWN_SIZE })
      .then((res) => {
        if (!cancelled) dispatch({ type: 'items_loaded', items: res.items ?? [] })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'items_loaded', items: [] })
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const markRead = async (item: NotificationDto) => {
    if (item.isRead || !item.id) return
    dispatch({ type: 'mark_read', id: item.id })
    try {
      await NotificationsService.postApiNotificationsNotificationsRead({ id: item.id })
    } catch {
      fetchCount()
    }
  }

  const markAllRead = async () => {
    dispatch({ type: 'mark_all_read' })
    try {
      await NotificationsService.postApiNotificationsNotificationsReadAll()
    } catch {
      fetchCount()
    }
  }

  const iconBtn =
    'w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer'

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => dispatch({ type: 'toggle_open' })}
          aria-label="Уведомления"
          className={cn(iconBtn, open && 'bg-white/10')}
        >
          <Bell className={cn('w-5 h-5', iconClassName ?? 'text-nav-text/70')} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.13 }}
              className="absolute top-full right-0 mt-2 z-50 rounded-xl border border-white/10 bg-nav-bg/95 backdrop-blur-md shadow-xl w-80 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <p className="text-nav-text text-sm font-semibold">Уведомления</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-nav-text/50 hover:text-nav-text transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Прочитать все
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 text-nav-text/40 animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <BellOff className="w-6 h-6 text-nav-text/25" />
                    <p className="text-xs text-nav-text/40">Нет уведомлений</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const cat = notificationCategory(item.type!)
                    const dotColor = CATEGORY_DOT_COLORS[cat]
                    const link = notificationLink(item)
                    const rowClass = cn(
                      'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0',
                      !item.isRead && 'bg-white/4',
                    )
                    const handleClick = () => {
                      void markRead(item)
                      dispatch({ type: 'close' })
                    }
                    const inner = (
                      <>
                        <span
                          className={cn(
                            'mt-1.5 w-2 h-2 rounded-full shrink-0',
                            dotColor,
                            item.isRead && 'opacity-0',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-nav-text/90 truncate">
                            {item.title ?? NOTIFICATION_LABELS[item.type!]}
                          </p>
                          {item.body && (
                            <p className="text-[11px] text-nav-text/50 line-clamp-2 mt-0.5 leading-relaxed">
                              {item.body}
                            </p>
                          )}
                          <p className="text-[10px] text-nav-text/35 mt-1">
                            {item.createdAt ? timeAgo(item.createdAt) : ''}
                          </p>
                        </div>
                        {!item.isRead && (
                          <Check className="w-3 h-3 text-nav-text/30 shrink-0 mt-1" />
                        )}
                      </>
                    )
                    return link ? (
                      <Link key={item.id} to={link} onClick={handleClick} className={rowClass}>
                        {inner}
                      </Link>
                    ) : (
                      <button key={item.id} onClick={handleClick} className={rowClass}>
                        {inner}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/8">
                <Link
                  to="/notifications"
                  onClick={() => dispatch({ type: 'close' })}
                  className="block text-center text-xs text-nav-text/50 hover:text-nav-text transition-colors py-3 cursor-pointer"
                >
                  Все уведомления
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast portal — top-right, below navbar */}
      {createPortal(
        <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                className="pointer-events-auto"
                initial={{ opacity: 0, x: 60, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                <NotificationToast
                  notification={toast}
                  onDismiss={hideToast}
                  onRead={onToastRead}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </>
  )
}
