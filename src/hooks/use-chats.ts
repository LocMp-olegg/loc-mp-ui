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

  return { ...state, loadMore, reload }
}
