import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { ChatsService } from '@/api/chat'
import type { MessageDto } from '@/api/chat'
import { useAuth } from '@/contexts/auth-context'
import { hasRole } from '@/lib/utils'
import { useChatHub, type ChatHubHandle } from '@/hooks/use-chat-hub'

// ── Event system ────────────────────────────────────────────────────────────

type MessageHandler = (message: MessageDto) => void
type DeletedHandler = (data: { chatId: string; messageId: string }) => void
type ClosedHandler = (data: { chatId: string }) => void
type TypingHandler = (data: {
  chatId: string
  userId: string
  userName: string
  isTyping: boolean
}) => void
type MessagesReadHandler = (data: { chatId: string; byUserId: string }) => void

interface Listeners {
  messageReceived: Set<MessageHandler>
  messageDeleted: Set<DeletedHandler>
  chatClosed: Set<ClosedHandler>
  typing: Set<TypingHandler>
  messagesRead: Set<MessagesReadHandler>
}

// ── Context value ────────────────────────────────────────────────────────────

interface ChatContextValue extends ChatHubHandle {
  unreadCount: number
  supportUnreadCount: number
  refreshUnreadCount: () => void
  setActiveChatId: (id: string | null) => void
  decrementUnreadCount: (n: number) => void
  decrementSupportUnreadCount: (n: number) => void
  onMessageReceived: (handler: MessageHandler) => () => void
  onMessageDeleted: (handler: DeletedHandler) => () => void
  onChatClosed: (handler: ClosedHandler) => () => void
  onTyping: (handler: TypingHandler) => () => void
  onMessagesRead: (handler: MessagesReadHandler) => () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

function ChatProviderInner({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isAdmin = hasRole(user?.role ?? [], 'Admin')
  const [unreadCount, setUnreadCount] = useState(0)
  const [supportUnreadCount, setSupportUnreadCount] = useState(0)
  const listenersRef = useRef<Listeners>({
    messageReceived: new Set(),
    messageDeleted: new Set(),
    chatClosed: new Set(),
    typing: new Set(),
    messagesRead: new Set(),
  })
  const activeChatIdRef = useRef<string | null>(null)
  const seenMessageIdsRef = useRef(new Set<string>())

  const refreshUnreadCount = useCallback(() => {
    const regular = ChatsService.getApiChatsChatsUnreadCount()
      .then((c) => c ?? 0)
      .catch(() => 0)

    const support = isAdmin
      ? ChatsService.getApiChatsChatsSupport({ hasUnread: true, pageSize: 100 })
          .then((r) => (r.items ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0))
          .catch(() => 0)
      : Promise.resolve(0)

    void Promise.all([regular, support]).then(([r, s]) => {
      setUnreadCount(r)
      setSupportUnreadCount(s)
    })
  }, [isAdmin])

  const setActiveChatId = useCallback((id: string | null) => {
    activeChatIdRef.current = id
  }, [])

  const decrementUnreadCount = useCallback((n: number) => {
    if (n > 0) setUnreadCount((c) => Math.max(0, c - n))
  }, [])

  const decrementSupportUnreadCount = useCallback((n: number) => {
    if (n > 0) setSupportUnreadCount((c) => Math.max(0, c - n))
  }, [])

  useEffect(() => {
    refreshUnreadCount()
    const id = setInterval(refreshUnreadCount, 60_000)
    return () => clearInterval(id)
  }, [refreshUnreadCount])

  const hub = useChatHub({
    onMessageReceived: (msg) => {
      if (msg.id && seenMessageIdsRef.current.has(msg.id)) return
      if (msg.id) {
        seenMessageIdsRef.current.add(msg.id)
        if (seenMessageIdsRef.current.size > 200) {
          const [first] = seenMessageIdsRef.current
          seenMessageIdsRef.current.delete(first)
        }
      }
      listenersRef.current.messageReceived.forEach((h) => h(msg))
      if (msg.chatId !== activeChatIdRef.current) {
        setUnreadCount((c) => c + 1)
      }
    },
    onMessageDeleted: (data) => {
      listenersRef.current.messageDeleted.forEach((h) => h(data))
    },
    onChatClosed: (data) => {
      listenersRef.current.chatClosed.forEach((h) => h(data))
    },
    onTyping: (data) => {
      listenersRef.current.typing.forEach((h) => h(data))
    },
    onMessagesRead: (data) => {
      listenersRef.current.messagesRead.forEach((h) => h(data))
    },
  })

  const onMessageReceived = useCallback((handler: MessageHandler) => {
    listenersRef.current.messageReceived.add(handler)
    return () => listenersRef.current.messageReceived.delete(handler)
  }, [])

  const onMessageDeleted = useCallback((handler: DeletedHandler) => {
    listenersRef.current.messageDeleted.add(handler)
    return () => listenersRef.current.messageDeleted.delete(handler)
  }, [])

  const onChatClosed = useCallback((handler: ClosedHandler) => {
    listenersRef.current.chatClosed.add(handler)
    return () => listenersRef.current.chatClosed.delete(handler)
  }, [])

  const onTyping = useCallback((handler: TypingHandler) => {
    listenersRef.current.typing.add(handler)
    return () => listenersRef.current.typing.delete(handler)
  }, [])

  const onMessagesRead = useCallback((handler: MessagesReadHandler) => {
    listenersRef.current.messagesRead.add(handler)
    return () => listenersRef.current.messagesRead.delete(handler)
  }, [])

  return (
    <ChatContext.Provider
      value={{
        unreadCount,
        supportUnreadCount,
        refreshUnreadCount,
        setActiveChatId,
        decrementUnreadCount,
        decrementSupportUnreadCount,
        ...hub,
        onMessageReceived,
        onMessageDeleted,
        onChatClosed,
        onTyping,
        onMessagesRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth()

  if (initializing || !isAuthenticated) {
    return (
      <ChatContext.Provider
        value={{
          unreadCount: 0,
          supportUnreadCount: 0,
          refreshUnreadCount: () => {},
          setActiveChatId: () => {},
          decrementUnreadCount: () => {},
          decrementSupportUnreadCount: () => {},
          joinChat: async () => {},
          leaveChat: async () => {},
          startTyping: async () => {},
          stopTyping: async () => {},
          onMessageReceived: () => () => {},
          onMessageDeleted: () => () => {},
          onChatClosed: () => () => {},
          onTyping: () => () => {},
          onMessagesRead: () => () => {},
        }}
      >
        {children}
      </ChatContext.Provider>
    )
  }

  return <ChatProviderInner>{children}</ChatProviderInner>
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used inside ChatProvider')
  return ctx
}
