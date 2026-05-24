import { ChatListItem } from './chat-list-item'
import { ChatListSkeleton } from './chat-list-skeleton'
import { ChatEmpty } from './chat-empty'
import type { ChatSummaryDto } from '@/api/chat'

interface ChatsListProps {
  chats: ChatSummaryDto[]
  loading: boolean
  error: string | null
  hasMore: boolean
  onLoadMore: () => void
  backTo?: string
  currentUserId?: string
}

export function ChatsList({
  chats,
  loading,
  error,
  hasMore,
  onLoadMore,
  backTo,
  currentUserId,
}: ChatsListProps) {
  if (loading && chats.length === 0) return <ChatListSkeleton />

  if (error) {
    return <div className="py-10 text-center text-sm text-destructive">{error}</div>
  }

  if (chats.length === 0) return <ChatEmpty />

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <ChatListItem key={chat.id} chat={chat} backTo={backTo} currentUserId={currentUserId} />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          {loading ? 'Загрузка…' : 'Показать ещё'}
        </button>
      )}
    </div>
  )
}
