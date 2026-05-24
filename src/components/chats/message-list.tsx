import { useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronDown } from 'lucide-react'
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
  chatId: string
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
const NEAR_TOP_THRESHOLD = 80

export function MessageList({
  chatId,
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
  const [isNearBottom, setIsNearBottom] = useState(true)

  // Save scroll position when leaving a chat; clear saved state on enter
  useEffect(() => {
    return () => {
      const el = scrollRef.current
      if (!el) return
      sessionStorage.setItem(`chat-scroll-${chatId}`, String(Math.round(el.scrollTop)))
    }
  }, [chatId])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD
    wasNearBottomRef.current = nearBottom
    setIsNearBottom(nearBottom)
    // Auto-load older messages when scrolled near the top
    if (el.scrollTop < NEAR_TOP_THRESHOLD && hasOlderMessages && !loadingOlder) {
      prevScrollHeightRef.current = el.scrollHeight
      onLoadOlder()
    }
  }, [hasOlderMessages, loadingOlder, onLoadOlder])

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || messages.length === 0) {
      // Reset for next load (e.g. chat switch)
      isInitialRef.current = true
      wasNearBottomRef.current = true
      setIsNearBottom(true)
      return
    }

    if (isInitialRef.current) {
      isInitialRef.current = false

      // Restore saved scroll position if available
      const saved = sessionStorage.getItem(`chat-scroll-${chatId}`)
      if (saved !== null) {
        el.scrollTop = parseInt(saved)
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD
        setIsNearBottom(nearBottom)
        wasNearBottomRef.current = nearBottom
        return
      }

      // Scroll to first unread message so user can read them top-to-bottom
      const firstUnread = messages.find((m) => !m.isRead)
      if (firstUnread) {
        const msgEl = el.querySelector(`[data-msg-id="${firstUnread.id}"]`) as HTMLElement | null
        if (msgEl) {
          el.scrollTop = Math.max(0, msgEl.offsetTop - paddingTop)
          setIsNearBottom(false)
          wasNearBottomRef.current = false
        } else {
          el.scrollTop = el.scrollHeight
        }
      } else {
        el.scrollTop = el.scrollHeight
      }
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
  }, [messages, paddingTop, chatId])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || typingUsers.length === 0 || !wasNearBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [typingUsers.length])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 relative min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 space-y-2 overscroll-none [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]"
        style={{ paddingTop, paddingBottom }}
      >
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const showSeparator =
              msg.sentAt != null &&
              (i === 0 || dayKey(msg.sentAt) !== dayKey(messages[i - 1].sentAt ?? ''))
            return (
              <div key={msg.id} data-msg-id={msg.id}>
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

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {!isNearBottom && (
          <motion.button
            key="scroll-btn"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.15 }}
            style={{ bottom: paddingBottom + 12 }}
            className="absolute right-4 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer bg-nav-bg/70 backdrop-blur-xl border border-white/10 text-nav-text shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-nav-bg/90 transition-colors"
            onClick={scrollToBottom}
            aria-label="Прокрутить вниз"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
