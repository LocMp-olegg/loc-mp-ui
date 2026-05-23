import { useRef, useEffect, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import type { MessageDto } from '@/api/chat'
import type { TypingUser } from '@/hooks/use-chat-messages'

const TODAY_YEAR = new Date().getFullYear()

function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso)
  const year = d.getFullYear()
  const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  return year !== TODAY_YEAR ? `${label} ${year}` : label
}

function DateSeparator({ iso }: { iso: string }) {
  return (
    <div className="flex justify-center py-2 select-none">
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-nav-bg/60 text-nav-text/80 backdrop-blur-md border border-white/10 shadow-sm">
        {formatDayLabel(iso)}
      </span>
    </div>
  )
}

interface MessageListProps {
  messages: MessageDto[]
  loading: boolean
  loadingOlder: boolean
  hasOlderMessages: boolean
  onLoadOlder: () => void
  currentUserId: string
  typingUsers: TypingUser[]
  paddingTop?: number
  paddingBottom?: number
}

const NEAR_BOTTOM_THRESHOLD = 150

export function MessageList({
  messages,
  loading,
  loadingOlder,
  hasOlderMessages,
  onLoadOlder,
  currentUserId,
  typingUsers,
  paddingTop = 12,
  paddingBottom = 12,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const isInitialRef = useRef(true)
  const wasNearBottomRef = useRef(true)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    wasNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD
  }

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || messages.length === 0) return

    if (isInitialRef.current) {
      el.scrollTop = el.scrollHeight
      isInitialRef.current = false
      return
    }

    if (prevScrollHeightRef.current > 0) {
      el.scrollTop += el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = 0
      return
    }

    if (wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || typingUsers.length === 0 || !wasNearBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [typingUsers.length])

  useEffect(() => {
    isInitialRef.current = true
    wasNearBottomRef.current = true
  }, [])

  const handleLoadOlder = () => {
    if (scrollRef.current) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight
    }
    onLoadOlder()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 space-y-2 overscroll-none"
      style={{ paddingTop, paddingBottom }}
    >
      {hasOlderMessages && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={handleLoadOlder}
            disabled={loadingOlder}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {loadingOlder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {loadingOlder ? 'Загрузка…' : 'Загрузить предыдущие'}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((msg, i) => {
          const showSeparator =
            msg.sentAt != null &&
            (i === 0 || dayKey(msg.sentAt) !== dayKey(messages[i - 1].sentAt ?? ''))
          return (
            <div key={msg.id}>
              {showSeparator && <DateSeparator iso={msg.sentAt!} />}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <MessageBubble message={msg} isOwn={msg.senderId === currentUserId} />
              </motion.div>
            </div>
          )
        })}
      </AnimatePresence>

      <TypingIndicator users={typingUsers} />
    </div>
  )
}
