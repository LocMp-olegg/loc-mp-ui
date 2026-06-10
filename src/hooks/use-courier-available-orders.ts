import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { CourierService } from '@/api/orders'
import { orderListReducer, ORDER_LIST_INITIAL } from '@/lib/order-list-state'
import type { ApplyCourierRequest } from '@/api/orders'

function useAppliedIds() {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set())
  const add = useCallback((id: string) => setIds((prev) => new Set([...prev, id])), [])
  const sync = useCallback(
    (orderIds: string[]) =>
      setIds((prev) => {
        if (orderIds.every((id) => prev.has(id))) return prev
        return new Set([...prev, ...orderIds])
      }),
    [],
  )
  return { ids, add, sync }
}

const PAGE_SIZE = 20

export function useCourierAvailableOrders({
  latitude,
  longitude,
  radiusKm,
}: {
  latitude: number | null | undefined
  longitude: number | null | undefined
  radiusKm: number
}) {
  const [state, dispatch] = useReducer(orderListReducer, ORDER_LIST_INITIAL)
  const [reloadKey, setReloadKey] = useState(0)
  const { ids: appliedIds, add: markApplied, sync: syncApplied } = useAppliedIds()
  const pageRef = useRef(1)
  const fetchingMoreRef = useRef(false)

  const paramsRef = useRef({ latitude, longitude, radiusKm })
  useEffect(() => {
    paramsRef.current = { latitude, longitude, radiusKm }
  })

  useEffect(() => {
    if (latitude == null || longitude == null) {
      dispatch({ type: 'success', orders: [], hasNextPage: false, totalCount: 0, append: false })
      return
    }
    let cancelled = false
    pageRef.current = 1
    dispatch({ type: 'loading' })
    CourierService.getApiOrdersCourierOrdersAvailable({
      latitude,
      longitude,
      radiusKm,
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
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить заказы' })
      })
    return () => {
      cancelled = true
    }
  }, [latitude, longitude, radiusKm, reloadKey])

  const loadMore = useCallback(() => {
    if (fetchingMoreRef.current) return
    const p = paramsRef.current
    if (p.latitude == null || p.longitude == null) return
    fetchingMoreRef.current = true
    const nextPage = pageRef.current + 1
    pageRef.current = nextPage
    dispatch({ type: 'loading' })
    CourierService.getApiOrdersCourierOrdersAvailable({
      latitude: p.latitude,
      longitude: p.longitude,
      radiusKm: p.radiusKm,
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
        dispatch({ type: 'error', message: 'Не удалось загрузить заказы' })
      })
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const apply = useCallback(
    async (orderId: string, req: ApplyCourierRequest): Promise<void> => {
      await CourierService.postApiOrdersCourierOrdersApply({ id: orderId, requestBody: req })
      markApplied(orderId)
    },
    [markApplied],
  )

  return { ...state, appliedIds, loadMore, reload, apply, syncApplied }
}
