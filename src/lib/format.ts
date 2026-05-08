import { formatPhone } from '@/lib/auth-validation'
import type { OrderStatus, DisputeOutcome } from '@/api/orders'

export const ORDER_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  Pending: 'Новый',
  Confirmed: 'Подтверждён',
  ReadyForPickup: 'Готов к выдаче',
  InDelivery: 'Доставляется',
  Completed: 'Завершён',
  Cancelled: 'Отменён',
  Disputed: 'Спор открыт',
}

export const DISPUTE_OUTCOME_LABELS: Record<DisputeOutcome, string> = {
  BuyerFavored: 'В пользу покупателя',
  SellerFavored: 'В пользу продавца',
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTimeShort(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function shortOrderId(id: string | undefined): string {
  if (!id) return '—'
  return id.slice(-8).toUpperCase()
}

export function displayPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return formatPhone(digits)
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8'))
    return formatPhone(digits.slice(1))
  return phone
}
