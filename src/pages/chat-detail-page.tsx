import { useParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useChatMessages } from '@/hooks/use-chat-messages'
import { ChatHeader } from '@/components/chats/chat-header'
import { MessageList } from '@/components/chats/message-list'
import { MessageInput } from '@/components/chats/message-input'

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { state } = useLocation()
  const backTo = (state as { backTo?: string } | null)?.backTo ?? '/chats'

  const {
    chatInfo,
    messages,
    loading,
    loadingOlder,
    hasOlderMessages,
    loadOlderMessages,
    sendMessage,
    notifyTyping,
    typingUsers,
  } = useChatMessages(id!)

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
      <ChatHeader chatInfo={chatInfo} backTo={backTo} currentUserId={user?.id} />

      <MessageList
        messages={messages}
        loading={loading}
        loadingOlder={loadingOlder}
        hasOlderMessages={hasOlderMessages}
        onLoadOlder={loadOlderMessages}
        currentUserId={user?.id ?? ''}
        typingUsers={typingUsers}
      />

      <MessageInput
        onSend={(body, files) => sendMessage(body, files)}
        onTyping={notifyTyping}
        disabled={chatInfo?.status === 'Closed'}
      />
    </div>
  )
}
