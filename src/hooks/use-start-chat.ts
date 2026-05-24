import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatsService } from '@/api/chat'
import type { ChatType } from '@/api/chat'

interface StartChatParams {
  type: ChatType
  targetUserId?: string
  targetUserName?: string
  referenceId?: string
  initialMessage?: string
}

export function useStartChat() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function startChat(params: StartChatParams, backTo?: string) {
    setLoading(true)
    try {
      const chat = await ChatsService.postApiChatsChats({
        requestBody: {
          type: params.type,
          targetUserId: params.targetUserId,
          targetUserName: params.targetUserName,
          referenceId: params.referenceId,
          initialMessage: params.initialMessage,
        },
      })
      navigate(`/chats/${chat.id}`, { state: backTo ? { backTo } : undefined })
    } finally {
      setLoading(false)
    }
  }

  return { startChat, loading }
}
