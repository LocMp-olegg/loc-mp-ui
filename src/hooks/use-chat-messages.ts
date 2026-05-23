import { useState, useEffect, useReducer, useRef, useCallback } from 'react'
import { ChatsService } from '@/api/chat'
import type { ChatDto, MessageDto } from '@/api/chat'
import { useChatContext } from '@/contexts/chat-context'

const PAGE_SIZE = 50

export interface TypingUser {
  userId: string
  userName: string
}

type ChatState = {
  messages: MessageDto[]
  loading: boolean
  currentPage: number
}

type ChatAction =
  | { type: 'reset' }
  | { type: 'loaded'; messages: MessageDto[] }
  | { type: 'loadFailed' }
  | { type: 'append'; message: MessageDto }
  | { type: 'markDeleted'; messageId: string }
  | { type: 'prepend'; messages: MessageDto[]; nextPage: number }
  | { type: 'markAllRead' }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'reset':
      return { messages: [], loading: true, currentPage: 1 }
    case 'loaded':
      return { ...state, messages: action.messages, loading: false }
    case 'loadFailed':
      return { ...state, loading: false }
    case 'append':
      return { ...state, messages: [...state.messages, action.message] }
    case 'markDeleted':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId ? { ...m, isDeleted: true } : m,
        ),
      }
    case 'prepend':
      return {
        ...state,
        messages: [...action.messages, ...state.messages],
        currentPage: action.nextPage,
      }
    case 'markAllRead':
      return {
        ...state,
        messages: state.messages.map((m) => (m.isRead ? m : { ...m, isRead: true })),
      }
  }
}

export function useChatMessages(chatId: string) {
  const [chatInfo, setChatInfo] = useState<ChatDto | null>(null)
  const [state, dispatch] = useReducer(chatReducer, { messages: [], loading: true, currentPage: 1 })
  const [totalCount, setTotalCount] = useState(0)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingOlderRef = useRef(false)

  const hasOlderMessages = totalCount > 0 && state.currentPage * PAGE_SIZE < totalCount

  const {
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    onMessageReceived,
    onMessageDeleted,
    onChatClosed,
    onTyping,
    onMessagesRead,
    refreshUnreadCount,
  } = useChatContext()

  // ── initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'reset' })

    ChatsService.getApiChatsChats1({ id: chatId })
      .then((info) => {
        if (!cancelled) setChatInfo(info)
      })
      .catch(() => {})

    ChatsService.getApiChatsChatsMessages({ id: chatId, page: 1, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        const msgs = (result.items ?? []).slice().reverse()
        dispatch({ type: 'loaded', messages: msgs })
        setTotalCount(result.totalCount ?? 0)
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'loadFailed' })
      })

    void joinChat(chatId)
    void ChatsService.putApiChatsChatsMessagesRead({ id: chatId })
    refreshUnreadCount()

    const timers = typingTimersRef.current
    return () => {
      cancelled = true
      void leaveChat(chatId)
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current)
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [chatId, joinChat, leaveChat, refreshUnreadCount])

  // ── real-time events ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsubMessage = onMessageReceived((msg) => {
      if (msg.chatId !== chatId) return
      dispatch({ type: 'append', message: msg })
      void ChatsService.putApiChatsChatsMessagesRead({ id: chatId })
      refreshUnreadCount()
    })

    const unsubDeleted = onMessageDeleted(({ chatId: cId, messageId }) => {
      if (cId !== chatId) return
      dispatch({ type: 'markDeleted', messageId })
    })

    const unsubClosed = onChatClosed(({ chatId: cId }) => {
      if (cId !== chatId) return
      setChatInfo((prev) => (prev ? { ...prev, status: 'Closed' } : prev))
    })

    const unsubTyping = onTyping(({ chatId: cId, userId, userName, isTyping: isT }) => {
      if (cId !== chatId) return
      const existing = typingTimersRef.current.get(userId)
      if (existing) clearTimeout(existing)

      if (isT) {
        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.userId !== userId)
          return [...filtered, { userId, userName }]
        })
        const timer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
          typingTimersRef.current.delete(userId)
        }, 3000)
        typingTimersRef.current.set(userId, timer)
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
        typingTimersRef.current.delete(userId)
      }
    })

    const unsubRead = onMessagesRead(({ chatId: cId }) => {
      if (cId !== chatId) return
      dispatch({ type: 'markAllRead' })
    })

    return () => {
      unsubMessage()
      unsubDeleted()
      unsubClosed()
      unsubTyping()
      unsubRead()
    }
  }, [
    chatId,
    onMessageReceived,
    onMessageDeleted,
    onChatClosed,
    onTyping,
    onMessagesRead,
    refreshUnreadCount,
  ])

  // ── load older messages ──────────────────────────────────────────────────
  const loadOlderMessages = useCallback(() => {
    if (loadingOlderRef.current || !hasOlderMessages) return
    loadingOlderRef.current = true
    setLoadingOlder(true)

    const nextPage = state.currentPage + 1
    ChatsService.getApiChatsChatsMessages({ id: chatId, page: nextPage, pageSize: PAGE_SIZE })
      .then((result) => {
        const older = (result.items ?? []).slice().reverse()
        dispatch({ type: 'prepend', messages: older, nextPage })
        setTotalCount(result.totalCount ?? 0)
      })
      .catch(() => {})
      .finally(() => {
        setLoadingOlder(false)
        loadingOlderRef.current = false
      })
  }, [chatId, hasOlderMessages, state.currentPage])

  // ── send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (body: string, files?: File[]) => {
      await ChatsService.postApiChatsChatsMessages({
        id: chatId,
        formData: {
          ...(body.trim() ? { Body: body.trim() } : {}),
          ...(files?.length ? { Attachments: files } : {}),
        },
      })
    },
    [chatId],
  )

  // ── typing notification ──────────────────────────────────────────────────
  const notifyTyping = useCallback(() => {
    void startTyping(chatId)
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current)
    stopTypingTimerRef.current = setTimeout(() => {
      void stopTyping(chatId)
      stopTypingTimerRef.current = null
    }, 1500)
  }, [chatId, startTyping, stopTyping])

  return {
    chatInfo,
    messages: state.messages,
    loading: state.loading,
    loadingOlder,
    hasOlderMessages,
    loadOlderMessages,
    sendMessage,
    notifyTyping,
    typingUsers,
  }
}
