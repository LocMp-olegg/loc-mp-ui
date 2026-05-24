import { useReducer, useEffect, useCallback } from 'react'
import { ChatsService } from '@/api/chat'
import type { ChatSummaryDto, ChatType, ChatStatus } from '@/api/chat'

interface UseChatsParams {
  type?: ChatType
  status?: ChatStatus
  isSupport?: boolean
  pageSize?: number
}

interface ChatsState {
  chats: ChatSummaryDto[]
  loading: boolean
  error: string | null
  page: number
  total: number
  hasMore: boolean
}

type ChatsAction =
  | { type: 'reset' }
  | { type: 'append_loading' }
  | { type: 'success'; chats: ChatSummaryDto[]; total: number; page: number; append: boolean }
  | { type: 'error'; message: string }
  | { type: 'update_unread'; chatId: string; delta: number }
  | { type: 'touch_chat'; chatId: string; lastMessageAt: string }

function reducer(state: ChatsState, action: ChatsAction): ChatsState {
  switch (action.type) {
    case 'reset':
      return { chats: [], loading: true, error: null, page: 1, total: 0, hasMore: false }
    case 'append_loading':
      return { ...state, loading: true, error: null }
    case 'success': {
      const chats = action.append ? [...state.chats, ...action.chats] : action.chats
      return {
        chats,
        loading: false,
        error: null,
        page: action.page,
        total: action.total,
        hasMore: chats.length < action.total,
      }
    }
    case 'error':
      return { ...state, loading: false, error: action.message }
    case 'update_unread':
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === action.chatId
            ? { ...c, unreadCount: Math.max(0, (c.unreadCount ?? 0) + action.delta) }
            : c,
        ),
      }
    case 'touch_chat': {
      const updated = state.chats.map((c) =>
        c.id === action.chatId ? { ...c, lastMessageAt: action.lastMessageAt } : c,
      )
      updated.sort((a, b) => {
        const ta = a.lastMessageAt ?? a.createdAt ?? ''
        const tb = b.lastMessageAt ?? b.createdAt ?? ''
        return tb < ta ? -1 : tb > ta ? 1 : 0
      })
      return { ...state, chats: updated }
    }
  }
}

export function useChats({ type, status, isSupport = false, pageSize = 20 }: UseChatsParams = {}) {
  const [state, dispatch] = useReducer(reducer, {
    chats: [],
    loading: true,
    error: null,
    page: 1,
    total: 0,
    hasMore: false,
  })

  const fetchPage = useCallback(
    (page: number, append: boolean) => {
      dispatch(append ? { type: 'append_loading' } : { type: 'reset' })
      const request = isSupport
        ? ChatsService.getApiChatsChatsSupport({ status, page, pageSize })
        : ChatsService.getApiChatsChats({ type, status, page, pageSize })
      request
        .then((result) =>
          dispatch({
            type: 'success',
            chats: result.items ?? [],
            total: result.totalCount ?? 0,
            page,
            append,
          }),
        )
        .catch(() => dispatch({ type: 'error', message: 'Не удалось загрузить чаты' }))
    },
    [type, status, isSupport, pageSize],
  )

  useEffect(() => {
    fetchPage(1, false)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (!state.hasMore || state.loading) return
    fetchPage(state.page + 1, true)
  }, [state.hasMore, state.loading, state.page, fetchPage])

  const reload = useCallback(() => fetchPage(1, false), [fetchPage])

  const updateChatUnread = useCallback((chatId: string, delta: number) => {
    dispatch({ type: 'update_unread', chatId, delta })
  }, [])

  const touchChat = useCallback((chatId: string, lastMessageAt: string) => {
    dispatch({ type: 'touch_chat', chatId, lastMessageAt })
  }, [])

  return { ...state, loadMore, reload, updateChatUnread, touchChat }
}
