import React, { useRef, useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useChatMessages } from '@/hooks/use-chat-messages'
import { ChatHeader } from '@/components/chats/chat-header'
import { MessageList } from '@/components/chats/message-list'
import { MessageInput } from '@/components/chats/message-input'

function useElementHeight(ref: React.RefObject<HTMLDivElement | null>) {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    setHeight(el.offsetHeight)
    return () => ro.disconnect()
  }, [ref])
  return height
}

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { state } = useLocation()
  const backTo = (state as { backTo?: string } | null)?.backTo ?? '/chats'

  const headerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const headerH = useElementHeight(headerRef)
  const inputH = useElementHeight(inputRef)

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
    <div className="relative h-full overflow-hidden flex flex-col">
      <MessageList
        chatId={id!}
        messages={messages}
        loading={loading}
        loadingOlder={loadingOlder}
        hasOlderMessages={hasOlderMessages}
        onLoadOlder={loadOlderMessages}
        currentUserId={user?.id ?? ''}
        typingUsers={typingUsers}
        paddingTop={headerH}
        paddingBottom={inputH}
      />

      <div ref={headerRef} className="absolute top-0 inset-x-0 z-10">
        <ChatHeader chatInfo={chatInfo} backTo={backTo} currentUserId={user?.id} />
      </div>

      <div ref={inputRef} className="absolute bottom-0 inset-x-0 z-10">
        <MessageInput
          chatId={id!}
          onSend={(body, files) => sendMessage(body, files)}
          onTyping={notifyTyping}
          disabled={chatInfo?.status === 'Closed'}
        />
      </div>
    </div>
  )
}
