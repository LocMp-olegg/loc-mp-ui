import { useReducer, useEffect, useCallback, useState } from 'react'
import { CourierService } from '@/api/orders'
import type { CourierApplicationDto, OrderSummaryDto } from '@/api/orders'

const ACTIVE_STATUSES = new Set(['Confirmed', 'ReadyForCourier', 'InDelivery'])

type State = {
  applications: CourierApplicationDto[]
  activeOrders: OrderSummaryDto[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'loading' }
  | { type: 'success'; applications: CourierApplicationDto[]; activeOrders: OrderSummaryDto[] }
  | { type: 'error'; message: string }

const INITIAL: State = { applications: [], activeOrders: [], loading: true, error: null }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'success':
      return {
        loading: false,
        error: null,
        applications: action.applications,
        activeOrders: action.activeOrders,
      }
    case 'error':
      return { ...state, loading: false, error: action.message }
  }
}

export function useCourierMyDeliveries() {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })

    Promise.all([
      CourierService.getApiOrdersCourierApplications({ pageSize: 100 }),
      CourierService.getApiOrdersCourierOrders({ pageSize: 100 }),
    ])
      .then(([appsResult, ordersResult]) => {
        if (cancelled) return
        dispatch({
          type: 'success',
          applications: (appsResult.items ?? []).filter((a) => a.status === 'Pending'),
          activeOrders: (ordersResult.items ?? []).filter((o) =>
            ACTIVE_STATUSES.has(o.status ?? ''),
          ),
        })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить данные' })
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const withdraw = useCallback(async (applicationId: string): Promise<void> => {
    await CourierService.deleteApiOrdersCourierApplications({ applicationId })
    setReloadKey((k) => k + 1)
  }, [])

  const pickup = useCallback(async (orderId: string): Promise<void> => {
    await CourierService.postApiOrdersCourierOrdersPickup({ id: orderId })
    setReloadKey((k) => k + 1)
  }, [])

  const deliver = useCallback(async (orderId: string): Promise<void> => {
    await CourierService.postApiOrdersCourierOrdersDeliver({ id: orderId })
    setReloadKey((k) => k + 1)
  }, [])

  return { ...state, reload, withdraw, pickup, deliver }
}
