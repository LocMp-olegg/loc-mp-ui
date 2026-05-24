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
  targetMessageId?: string
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
  targetMessageId,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const isInitialRef = useRef(true)
  const wasNearBottomRef = useRef(true)
  const scrollTopRef = useRef<number | null>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  useEffect(() => {
    scrollTopRef.current = null
    return () => {
      if (scrollTopRef.current !== null) {
        sessionStorage.setItem(`chat-scroll-${chatId}`, String(scrollTopRef.current))
      }
    }
  }, [chatId])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    scrollTopRef.current = Math.round(el.scrollTop)
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD
    wasNearBottomRef.current = nearBottom
    setIsNearBottom(nearBottom)
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
      isInitialRef.current = true
      wasNearBottomRef.current = true
      setIsNearBottom(true)
      return
    }

    if (isInitialRef.current) {
      isInitialRef.current = false

      const saved = sessionStorage.getItem(`chat-scroll-${chatId}`)
      if (saved !== null) {
        el.scrollTop = parseInt(saved)
        scrollTopRef.current = Math.round(el.scrollTop)
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD
        setIsNearBottom(nearBottom)
        wasNearBottomRef.current = nearBottom
        return
      }

      if (targetMessageId) {
        const msgEl = el.querySelector(`[data-msg-id="${targetMessageId}"]`) as HTMLElement | null
        if (msgEl) {
          el.scrollTop = Math.max(0, msgEl.offsetTop - paddingTop - 40)
          scrollTopRef.current = Math.round(el.scrollTop)
          setIsNearBottom(false)
          wasNearBottomRef.current = false
          setHighlightedId(targetMessageId)
          setTimeout(() => setHighlightedId(null), 2000)
          return
        }
      }

      el.scrollTop = el.scrollHeight
      scrollTopRef.current = Math.round(el.scrollTop)
      if (el.scrollTop === 0 && el.scrollHeight > el.clientHeight) {
        requestAnimationFrame(() => {
          if (!scrollRef.current) return
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          scrollTopRef.current = Math.round(scrollRef.current.scrollTop)
        })
      }
      setIsNearBottom(true)
      wasNearBottomRef.current = true
      return
    }

    if (prevScrollHeightRef.current > 0) {
      el.scrollTop += el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = 0
      scrollTopRef.current = Math.round(el.scrollTop)
      return
    }

    if (wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight
      scrollTopRef.current = Math.round(el.scrollTop)
    }
  }, [messages, paddingTop, chatId, targetMessageId])

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
            const isHighlighted = msg.id === highlightedId
            return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className={
                  isHighlighted ? 'rounded-xl ring-2 ring-primary/40 transition-all' : undefined
                }
              >
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
