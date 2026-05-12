import { useReducer, useState, useEffect, useCallback, useRef } from 'react'
import { NotificationsService } from '@/api/notifications'
import type { NotificationDto } from '@/api/notifications'

const PAGE_SIZE = 20
const POLL_INTERVAL_MS = 60_000

interface State {
  items: NotificationDto[]
  totalCount: number
  hasNextPage: boolean
  loading: boolean
  unreadCount: number
}

type Action =
  | { type: 'fetching' }
  | {
      type: 'fetched'
      items: NotificationDto[]
      totalCount: number
      hasNextPage: boolean
      append: boolean
    }
  | { type: 'error' }
  | { type: 'unread_count'; count: number }
  | { type: 'mark_read'; id: string }
  | { type: 'mark_all_read' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetching':
      return { ...state, loading: true }
    case 'fetched':
      return {
        ...state,
        loading: false,
        items: action.append ? [...state.items, ...action.items] : action.items,
        totalCount: action.totalCount,
        hasNextPage: action.hasNextPage,
      }
    case 'error':
      return { ...state, loading: false }
    case 'unread_count':
      return { ...state, unreadCount: action.count }
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
  }
}

export function useNotifications() {
  const [{ items, totalCount, hasNextPage, loading, unreadCount }, dispatch] = useReducer(reducer, {
    items: [],
    totalCount: 0,
    hasNextPage: false,
    loading: false,
    unreadCount: 0,
  })
  const [page, setPage] = useState(1)
  const [onlyUnread, setOnlyUnreadState] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnreadCount = useCallback(() => {
    NotificationsService.getApiNotificationsNotificationsUnreadCount()
      .then((count) => dispatch({ type: 'unread_count', count }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchUnreadCount])

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'fetching' })

    NotificationsService.getApiNotificationsNotifications({
      onlyUnread: onlyUnread || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (!cancelled) {
          dispatch({
            type: 'fetched',
            items: result.items ?? [],
            totalCount: result.totalCount ?? 0,
            hasNextPage: result.hasNextPage ?? false,
            append: page > 1,
          })
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [page, onlyUnread])

  const setOnlyUnread = (val: boolean) => {
    setOnlyUnreadState(val)
    setPage(1)
  }

  const loadMore = () => setPage((p) => p + 1)

  const markRead = useCallback(async (id: string) => {
    dispatch({ type: 'mark_read', id })
    try {
      await NotificationsService.postApiNotificationsNotificationsRead({ id })
    } catch {
      /* empty */
    }
  }, [])

  const markAllRead = useCallback(async () => {
    dispatch({ type: 'mark_all_read' })
    try {
      await NotificationsService.postApiNotificationsNotificationsReadAll()
    } catch {
      fetchUnreadCount()
    }
  }, [fetchUnreadCount])

  return {
    items,
    totalCount,
    hasNextPage,
    loading,
    unreadCount,
    onlyUnread,
    setOnlyUnread,
    loadMore,
    markRead,
    markAllRead,
    refetchUnreadCount: fetchUnreadCount,
  }
}
