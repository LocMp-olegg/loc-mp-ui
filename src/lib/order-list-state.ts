import type { OrderSummaryDto } from '@/api/orders'

export type OrderListState = {
  orders: OrderSummaryDto[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  totalCount: number
}

export type OrderListAction =
  | { type: 'loading' }
  | {
      type: 'success'
      orders: OrderSummaryDto[]
      hasNextPage: boolean
      totalCount: number
      append: boolean
    }
  | { type: 'error'; message: string }

export const ORDER_LIST_INITIAL: OrderListState = {
  orders: [],
  loading: true,
  error: null,
  hasNextPage: false,
  totalCount: 0,
}

export function orderListReducer(s: OrderListState, a: OrderListAction): OrderListState {
  switch (a.type) {
    case 'loading':
      return { ...s, loading: true, error: null }
    case 'success':
      return {
        orders: a.append ? [...s.orders, ...a.orders] : a.orders,
        loading: false,
        error: null,
        hasNextPage: a.hasNextPage,
        totalCount: a.totalCount,
      }
    case 'error':
      return { ...s, loading: false, error: a.message }
  }
}
