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
  refreshUnreadCount: () => void
  onMessageReceived: (handler: MessageHandler) => () => void
  onMessageDeleted: (handler: DeletedHandler) => () => void
  onChatClosed: (handler: ClosedHandler) => () => void
  onTyping: (handler: TypingHandler) => () => void
  onMessagesRead: (handler: MessagesReadHandler) => () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

function ChatProviderInner({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const listenersRef = useRef<Listeners>({
    messageReceived: new Set(),
    messageDeleted: new Set(),
    chatClosed: new Set(),
    typing: new Set(),
    messagesRead: new Set(),
  })

  const refreshUnreadCount = useCallback(() => {
    ChatsService.getApiChatsChatsUnreadCount()
      .then((count) => setUnreadCount(count ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refreshUnreadCount()
    const id = setInterval(refreshUnreadCount, 60_000)
    return () => clearInterval(id)
  }, [refreshUnreadCount])

  const hub = useChatHub({
    onMessageReceived: (msg) => {
      listenersRef.current.messageReceived.forEach((h) => h(msg))
      // increment unread only if not currently viewing that chat
      setUnreadCount((c) => c + 1)
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
        refreshUnreadCount,
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
          refreshUnreadCount: () => {},
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
