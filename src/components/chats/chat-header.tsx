import { Link } from 'react-router-dom'
import { ArrowLeft, XCircle } from 'lucide-react'
import { ChatTypeAvatar } from './chat-type-avatar'
import { chatTitle } from '@/lib/chats'
import { cn } from '@/lib/utils'
import type { ChatDto } from '@/api/chat'

interface ChatHeaderProps {
  chatInfo: ChatDto | null
  backTo?: string
  currentUserId?: string
}

export function ChatHeader({ chatInfo, backTo = '/chats', currentUserId }: ChatHeaderProps) {
  const title = chatInfo ? chatTitle(chatInfo, currentUserId) : '...'
  const isClosed = chatInfo?.status === 'Closed'

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border/50',
        'bg-card/40 backdrop-blur-sm shrink-0',
      )}
    >
      <Link
        to={backTo}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        aria-label="Назад"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>

      {chatInfo && <ChatTypeAvatar type={chatInfo.type} className="w-9 h-9" />}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        {isClosed && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <XCircle className="w-3 h-3 shrink-0" />
            Чат закрыт
          </p>
        )}
      </div>
    </div>
  )
}
