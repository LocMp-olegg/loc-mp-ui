import type { NotificationDto, NotificationType } from '@/api/notifications'

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  OrderPlaced: 'Новый заказ',
  OrderConfirmed: 'Заказ подтверждён',
  OrderReadyForPickup: 'Заказ готов',
  OrderInDelivery: 'Заказ передан курьеру',
  OrderCompleted: 'Заказ выполнен',
  OrderCancelled: 'Заказ отменён',
  OrderDisputed: 'Спор по заказу',
  StockDepleted: 'Товар закончился',
  ReviewReceived: 'Новый отзыв',
  ReviewReplied: 'Ответ на отзыв',
  SystemAlert: 'Системное уведомление',
  SellerActivated: 'Аккаунт продавца активирован',
  AccountBlocked: 'Аккаунт заблокирован',
  AccountUnblocked: 'Аккаунт разблокирован',
  DisputeOpened: 'Спор открыт',
  DisputeResolved: 'Спор решён',
  ProductRestocked: 'Товар снова в наличии',
  NewMessage: 'Новое сообщение',
}

type NotificationCategory = 'order' | 'review' | 'stock' | 'account' | 'chat' | 'system'

export function notificationCategory(type: NotificationType): NotificationCategory {
  if (
    type === 'OrderPlaced' ||
    type === 'OrderConfirmed' ||
    type === 'OrderReadyForPickup' ||
    type === 'OrderInDelivery' ||
    type === 'OrderCompleted' ||
    type === 'OrderCancelled' ||
    type === 'OrderDisputed' ||
    type === 'DisputeOpened' ||
    type === 'DisputeResolved'
  )
    return 'order'
  if (type === 'ReviewReceived' || type === 'ReviewReplied') return 'review'
  if (type === 'StockDepleted' || type === 'ProductRestocked') return 'stock'
  if (type === 'AccountBlocked' || type === 'AccountUnblocked' || type === 'SellerActivated')
    return 'account'
  if (type === 'NewMessage') return 'chat'
  return 'system'
}

export const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  order: 'bg-primary/10 text-primary border-primary/20',
  review: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  stock: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  account: 'bg-destructive/10 text-destructive border-destructive/20',
  chat: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  system: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
}

export const CATEGORY_DOT_COLORS: Record<NotificationCategory, string> = {
  order: 'bg-primary',
  review: 'bg-amber-500',
  stock: 'bg-orange-500',
  account: 'bg-destructive',
  chat: 'bg-violet-500',
  system: 'bg-blue-500',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pid(payload: any, key: string): string | null {
  if (!payload || typeof payload !== 'object') return null
  const val = payload[key]
  return typeof val === 'string' && val.length > 0 ? val : null
}

export function notificationLink(n: NotificationDto): string | null {
  const p = n.payload
  switch (n.type) {
    case 'OrderPlaced':
      return '/seller/orders'
    case 'OrderConfirmed':
    case 'OrderReadyForPickup':
    case 'OrderInDelivery':
    case 'OrderCompleted':
    case 'OrderCancelled':
    case 'OrderDisputed':
    case 'DisputeOpened':
    case 'DisputeResolved': {
      const id = pid(p, 'orderId')
      return id ? `/orders/${id}` : '/orders'
    }
    case 'ReviewReceived':
    case 'ReviewReplied': {
      const id = pid(p, 'reviewId')
      return id ? `/reviews/${id}` : null
    }
    case 'StockDepleted': {
      const id = pid(p, 'productId')
      return id ? `/seller/products/${id}/edit` : '/seller/products'
    }
    case 'ProductRestocked': {
      const id = pid(p, 'productId')
      return id ? `/product/${id}` : null
    }
    case 'SellerActivated':
      return '/seller/shops'
    case 'NewMessage': {
      const id = pid(p, 'chatId')
      return id ? `/chats/${id}` : '/chats'
    }
    default:
      return null
  }
}
