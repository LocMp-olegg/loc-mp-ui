import type { ChatSummaryDto, ChatDto, ChatType } from '@/api/chat'
import { shortOrderId } from '@/lib/format'

export function chatTitle(chat: ChatSummaryDto | ChatDto, currentUserId?: string): string {
  if (chat.type === 'Order') {
    return `Заказ #${shortOrderId(chat.referenceId ?? undefined)}`
  }

  if (chat.type === 'Support') {
    const isInitiator = chat.participants?.some(
      (p) => p.userId === currentUserId && p.role === 'Initiator',
    )
    if (isInitiator || !currentUserId) return 'Поддержка'
    return chat.initiatorName ?? 'Пользователь'
  }

  // Shop or Direct: show the other side's name
  if (currentUserId) {
    const isInitiator = chat.participants?.some(
      (p) => p.userId === currentUserId && p.role === 'Initiator',
    )
    if (isInitiator) {
      return chat.targetName ?? (chat.type === 'Shop' ? 'Магазин' : 'Личное сообщение')
    }
    return chat.initiatorName ?? (chat.type === 'Shop' ? 'Магазин' : 'Личное сообщение')
  }

  return chat.type === 'Shop' ? 'Магазин' : 'Личное сообщение'
}

export function formatChatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86_400_000)

  if (diffDays === 0) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (diffDays < 7) return d.toLocaleDateString('ru-RU', { weekday: 'short' })
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export function formatMessageTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export const CHAT_TYPE_LABELS: Record<ChatType, string> = {
  Order: 'Заказ',
  Support: 'Поддержка',
  Shop: 'Магазин',
  Direct: 'Личное',
}
