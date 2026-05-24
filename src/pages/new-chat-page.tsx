import { useRef } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { ChatsService } from '@/api/chat'
import type { ChatType } from '@/api/chat'
import { ChatHeader } from '@/components/chats/chat-header'
import { MessageInput } from '@/components/chats/message-input'

export interface NewChatParams {
  type: ChatType
  targetUserId?: string
  targetUserName?: string
  referenceId?: string
  backTo?: string
}

export function NewChatPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const creatingRef = useRef(false)

  const params = (state ?? {}) as Partial<NewChatParams>
  const { type, targetUserId, targetUserName, referenceId, backTo = '/chats' } = params

  if (!type || (type !== 'Support' && !targetUserId)) {
    return <Navigate to="/chats" replace />
  }

  const draftKey = `new:${type}:${targetUserId ?? ''}:${referenceId ?? ''}`

  const mockChatInfo = {
    type,
    targetName: targetUserName,
    initiatorName: undefined,
    participants: [],
  }

  const handleSend = async (body: string, files: File[]) => {
    if (creatingRef.current) return
    creatingRef.current = true
    try {
      const hasFiles = files.length > 0
      const chat = await ChatsService.postApiChatsChats({
        requestBody: {
          type,
          targetUserId,
          targetUserName,
          referenceId,
          initialMessage: !hasFiles && body.trim() ? body.trim() : undefined,
        },
      })
      if (hasFiles) {
        await ChatsService.postApiChatsChatsMessages({
          id: chat.id!,
          formData: {
            ...(body.trim() ? { Body: body.trim() } : {}),
            Attachments: files,
          },
        })
      }
      sessionStorage.removeItem(`chat-draft-${draftKey}`)
      navigate(`/chats/${chat.id}`, { state: { backTo }, replace: true })
    } finally {
      creatingRef.current = false
    }
  }

  return (
    <div className="relative h-full overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 opacity-40" />
        </div>
        <p className="text-sm">Напишите первое сообщение</p>
      </div>

      <div className="absolute top-0 inset-x-0 z-10">
        <ChatHeader chatInfo={mockChatInfo as never} backTo={backTo} />
      </div>

      <div className="absolute bottom-0 inset-x-0 z-10">
        <MessageInput chatId={draftKey} onSend={handleSend} onTyping={() => {}} />
      </div>
    </div>
  )
}
