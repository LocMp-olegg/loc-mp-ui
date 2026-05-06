import { useReducer, useEffect, useCallback, useState, useRef } from 'react'
import { OrdersService } from '@/api/orders'
import type { OrderSummaryDto, OrderStatus, DeliveryType, OrderSortField } from '@/api/orders'

export interface MySalesFilters {
  shopId?: string
  statuses?: OrderStatus[]
  from?: string
  to?: string
  deliveryType?: DeliveryType
  sortBy?: OrderSortField
  descending?: boolean
  pageSize?: number
}

type State = {
  orders: OrderSummaryDto[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  totalCount: number
}

type Action =
  | { type: 'loading' }
  | {
      type: 'success'
      orders: OrderSummaryDto[]
      hasNextPage: boolean
      totalCount: number
      append: boolean
    }
  | { type: 'error'; message: string }

function reducer(s: State, a: Action): State {
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

export function useMySales({
  shopId,
  statuses,
  from,
  to,
  deliveryType,
  sortBy,
  descending = true,
  pageSize = 20,
}: MySalesFilters) {
  const [state, dispatch] = useReducer(reducer, {
    orders: [],
    loading: true,
    error: null,
    hasNextPage: false,
    totalCount: 0,
  })
  const [reloadKey, setReloadKey] = useState(0)
  const pageRef = useRef(1)
  const fetchingMoreRef = useRef(false)

  const filtersRef = useRef({
    shopId,
    statuses,
    from,
    to,
    deliveryType,
    sortBy,
    descending,
    pageSize,
  })
  useEffect(() => {
    filtersRef.current = { shopId, statuses, from, to, deliveryType, sortBy, descending, pageSize }
  })

  const statusKey = statuses?.join(',') ?? ''
  const filterKey = `${shopId}|${statusKey}|${from}|${to}|${deliveryType}|${sortBy}|${String(descending)}|${pageSize}`

  useEffect(() => {
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'loading' })
    const f = filtersRef.current
    OrdersService.getApiOrdersOrdersMySales({
      shopId: f.shopId,
      statuses: f.statuses,
      from: f.from,
      to: f.to,
      deliveryType: f.deliveryType,
      sortBy: f.sortBy,
      descending: f.descending,
      page: 1,
      pageSize: f.pageSize,
    })
      .then((data) => {
        if (!cancelled)
          dispatch({
            type: 'success',
            orders: data.items ?? [],
            hasNextPage: data.hasNextPage ?? false,
            totalCount: data.totalCount ?? 0,
            append: false,
          })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить заказы' })
      })
    return () => {
      cancelled = true
    }
  }, [filterKey, reloadKey])

  const loadMore = useCallback(() => {
    if (fetchingMoreRef.current) return
    fetchingMoreRef.current = true
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    dispatch({ type: 'loading' })
    const f = filtersRef.current
    OrdersService.getApiOrdersOrdersMySales({
      shopId: f.shopId,
      statuses: f.statuses,
      from: f.from,
      to: f.to,
      deliveryType: f.deliveryType,
      sortBy: f.sortBy,
      descending: f.descending,
      page: nextPage,
      pageSize: f.pageSize,
    })
      .then((data) => {
        fetchingMoreRef.current = false
        dispatch({
          type: 'success',
          orders: data.items ?? [],
          hasNextPage: data.hasNextPage ?? false,
          totalCount: data.totalCount ?? 0,
          append: true,
        })
      })
      .catch(() => {
        fetchingMoreRef.current = false
        dispatch({ type: 'error', message: 'Не удалось загрузить заказы' })
      })
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { ...state, loadMore, reload }
}
