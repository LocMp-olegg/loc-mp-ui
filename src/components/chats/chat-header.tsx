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
  const title = chatInfo ? chatTitle(chatInfo, currentUserId) : '…'
  const isClosed = chatInfo?.status === 'Closed'

  return (
    <div className="px-3 pt-3 pb-1 shrink-0">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2.5',
          'rounded-2xl',
          'bg-nav-bg/70 backdrop-blur-xl',
          'border border-white/10',
          'shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        )}
      >
        <Link
          to={backTo}
          className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-nav-text/60 hover:text-nav-text hover:bg-white/10 transition-colors shrink-0"
          aria-label="Назад"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {chatInfo && <ChatTypeAvatar type={chatInfo.type} className="w-9 h-9" />}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-nav-text truncate">{title}</p>
          {isClosed && (
            <p className="flex items-center gap-1 text-xs text-nav-text/50">
              <XCircle className="w-3 h-3 shrink-0" />
              Чат закрыт
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
