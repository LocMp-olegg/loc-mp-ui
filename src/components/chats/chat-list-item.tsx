import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { ChatTypeAvatar } from './chat-type-avatar'
import { chatTitle, formatChatTime } from '@/lib/chats'
import { cn } from '@/lib/utils'
import type { ChatSummaryDto } from '@/api/chat'

interface ChatListItemProps {
  chat: ChatSummaryDto
  backTo?: string
  currentUserId?: string
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="min-w-5 h-5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function LastMessageHint({ chat }: { chat: ChatSummaryDto }) {
  if (chat.status === 'Closed') {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <XCircle className="w-3 h-3 shrink-0" />
        Чат закрыт
      </span>
    )
  }
  if (!chat.lastMessageAt) {
    return <span className="text-xs text-muted-foreground italic">Нет сообщений</span>
  }
  return null
}

export function ChatListItem({ chat, backTo, currentUserId }: ChatListItemProps) {
  const title = chatTitle(chat, currentUserId)
  const time = formatChatTime(chat.lastMessageAt)
  const unread = chat.unreadCount ?? 0

  return (
    <Link
      to={`/chats/${chat.id}`}
      state={backTo ? { backTo } : undefined}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors cursor-pointer',
        'bg-card/40 border border-border/50 hover:bg-card/70',
        unread > 0 && 'border-primary/20',
      )}
    >
      <ChatTypeAvatar type={chat.type} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm font-medium truncate', unread > 0 && 'font-semibold')}>
            {title}
          </span>
          {time && (
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{time}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <LastMessageHint chat={chat} />
          <UnreadBadge count={unread} />
        </div>
      </div>
    </Link>
  )
}
