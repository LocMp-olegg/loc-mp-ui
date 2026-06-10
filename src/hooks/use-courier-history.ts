import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { CourierService } from '@/api/orders'
import { orderListReducer, ORDER_LIST_INITIAL } from '@/lib/order-list-state'
import type { OrderStatus } from '@/api/orders'

const PAGE_SIZE = 20

export interface CourierHistoryFilters {
  status?: OrderStatus
}

export function useCourierHistory({ status }: CourierHistoryFilters = {}) {
  const [state, dispatch] = useReducer(orderListReducer, ORDER_LIST_INITIAL)
  const [reloadKey, setReloadKey] = useState(0)
  const pageRef = useRef(1)
  const fetchingMoreRef = useRef(false)

  const filtersRef = useRef({ status })
  useEffect(() => {
    filtersRef.current = { status }
  })

  const filterKey = status ?? ''

  useEffect(() => {
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'loading' })
    CourierService.getApiOrdersCourierOrders({
      status: filtersRef.current.status,
      page: 1,
      pageSize: PAGE_SIZE,
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
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить историю' })
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
    CourierService.getApiOrdersCourierOrders({
      status: filtersRef.current.status,
      page: nextPage,
      pageSize: PAGE_SIZE,
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
        dispatch({ type: 'error', message: 'Не удалось загрузить историю' })
      })
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { ...state, loadMore, reload }
}
