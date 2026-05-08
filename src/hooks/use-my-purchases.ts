import { useReducer, useEffect, useCallback, useState, useRef } from 'react'
import { OrdersService } from '@/api/orders'
import { orderListReducer, ORDER_LIST_INITIAL } from '@/lib/order-list-state'
import type { OrderStatus } from '@/api/orders'

export interface MyPurchasesFilters {
  status?: OrderStatus
  pageSize?: number
}

export function useMyPurchases({ status, pageSize = 20 }: MyPurchasesFilters = {}) {
  const [state, dispatch] = useReducer(orderListReducer, ORDER_LIST_INITIAL)
  const [reloadKey, setReloadKey] = useState(0)
  const pageRef = useRef(1)
  const fetchingMoreRef = useRef(false)

  const filtersRef = useRef({ status, pageSize })
  useEffect(() => {
    filtersRef.current = { status, pageSize }
  })

  const filterKey = `${status ?? ''}|${pageSize}`

  useEffect(() => {
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'loading' })
    const f = filtersRef.current
    OrdersService.getApiOrdersOrdersMyPurchases({
      status: f.status,
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
    OrdersService.getApiOrdersOrdersMyPurchases({
      status: f.status,
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
