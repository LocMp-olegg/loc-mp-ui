import { useReducer, useState, useEffect, useCallback } from 'react'
import { OrdersService, DisputesService } from '@/api/orders'
import type { OrderDto, OrderPhotoDto, DisputePhotoDto, DisputeType } from '@/api/orders'

const MAX_PER_REQUEST = 5
const MAX_PHOTOS = 10

type State = { order: OrderDto | null; loading: boolean; error: string | null }
type Action =
  | { type: 'loading' }
  | { type: 'success'; order: OrderDto }
  | { type: 'error'; message: string }
  | { type: 'reset' }
  | { type: 'patch'; patch: Partial<OrderDto> }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'loading':
      return { ...s, loading: true, error: null }
    case 'success':
      return { order: a.order, loading: false, error: null }
    case 'error':
      return { order: s.order, loading: false, error: a.message }
    case 'reset':
      return { order: null, loading: false, error: null }
    case 'patch':
      return { ...s, order: s.order ? { ...s.order, ...a.patch } : s.order }
  }
}

export function useOrderDetail(orderId: string | null) {
  const [state, dispatch] = useReducer(reducer, { order: null, loading: false, error: null })
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchOrder = useCallback(async (id: string) => {
    dispatch({ type: 'loading' })
    try {
      const data = await OrdersService.getApiOrdersOrders({ id })
      dispatch({ type: 'success', order: data })
    } catch {
      dispatch({ type: 'error', message: 'Не удалось загрузить заказ' })
    }
  }, [])

  useEffect(() => {
    if (!orderId) {
      dispatch({ type: 'reset' })
      return
    }
    let cancelled = false
    dispatch({ type: 'loading' })
    OrdersService.getApiOrdersOrders({ id: orderId })
      .then((data) => {
        if (!cancelled) dispatch({ type: 'success', order: data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить заказ' })
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  const runAction = useCallback(async (fn: () => Promise<void>): Promise<boolean> => {
    setActionBusy(true)
    setActionError(null)
    try {
      await fn()
      return true
    } catch {
      setActionError('Не удалось выполнить действие')
      return false
    } finally {
      setActionBusy(false)
    }
  }, [])

  const reload = useCallback(() => {
    if (orderId) void fetchOrder(orderId)
  }, [orderId, fetchOrder])

  const confirm = useCallback(async () => {
    if (!state.order?.id) return false
    const id = state.order.id
    const ok = await runAction(() => OrdersService.postApiOrdersOrdersConfirm({ id }))
    if (ok) void fetchOrder(id)
    return ok
  }, [state.order, runAction, fetchOrder])

  const markReady = useCallback(async () => {
    if (!state.order?.id) return false
    const id = state.order.id
    const ok = await runAction(() => OrdersService.postApiOrdersOrdersReady({ id }))
    if (ok) void fetchOrder(id)
    return ok
  }, [state.order, runAction, fetchOrder])

  const cancel = useCallback(
    async (comment?: string) => {
      if (!state.order?.id) return false
      const id = state.order.id
      const ok = await runAction(() =>
        OrdersService.postApiOrdersOrdersCancel({ id, requestBody: { comment } }),
      )
      if (ok) void fetchOrder(id)
      return ok
    },
    [state.order, runAction, fetchOrder],
  )

  const complete = useCallback(async () => {
    if (!state.order?.id) return false
    const id = state.order.id
    const ok = await runAction(() => OrdersService.postApiOrdersOrdersComplete({ id }))
    if (ok) void fetchOrder(id)
    return ok
  }, [state.order, runAction, fetchOrder])

  const openDispute = useCallback(
    async (disputeType: DisputeType, reason: string) => {
      if (!state.order?.id) return false
      const id = state.order.id
      const ok = await runAction(() =>
        DisputesService.postApiOrdersDisputesDispute({ id, requestBody: { disputeType, reason } }),
      )
      if (ok) void fetchOrder(id)
      return ok
    },
    [state.order, runAction, fetchOrder],
  )

  const assignCourier = useCallback(
    async (courierId?: string, courierName?: string, courierPhone?: string) => {
      if (!state.order?.id) return false
      const id = state.order.id
      const ok = await runAction(() =>
        OrdersService.postApiOrdersOrdersAssignCourier({
          id,
          requestBody: { courierId, courierName, courierPhone },
        }),
      )
      if (ok) void fetchOrder(id)
      return ok
    },
    [state.order, runAction, fetchOrder],
  )

  const uploadPhotos = useCallback(
    async (files: Blob[]): Promise<OrderPhotoDto[] | null> => {
      if (!state.order?.id) return null
      const existing = state.order.photos?.length ?? 0
      const available = MAX_PHOTOS - existing
      if (available <= 0) {
        setActionError(`Достигнут лимит ${MAX_PHOTOS} фотографий`)
        return null
      }
      const toUpload = files.slice(0, available)
      setActionBusy(true)
      setActionError(null)
      try {
        const all: OrderPhotoDto[] = []
        for (let i = 0; i < toUpload.length; i += MAX_PER_REQUEST) {
          const batch = toUpload.slice(i, i + MAX_PER_REQUEST)
          const newPhotos = await OrdersService.postApiOrdersOrdersPhotos({
            id: state.order.id,
            formData: { images: batch },
          })
          all.push(...newPhotos)
        }
        dispatch({ type: 'patch', patch: { photos: [...(state.order.photos ?? []), ...all] } })
        return all
      } catch {
        setActionError('Не удалось загрузить фото')
        return null
      } finally {
        setActionBusy(false)
      }
    },
    [state.order],
  )

  const deletePhoto = useCallback(
    async (photoId: string) => {
      if (!state.order) return
      setActionBusy(true)
      setActionError(null)
      try {
        await OrdersService.deleteApiOrdersOrdersPhotos({ photoId })
        dispatch({
          type: 'patch',
          patch: { photos: (state.order.photos ?? []).filter((p) => p.id !== photoId) },
        })
      } catch {
        setActionError('Не удалось удалить фото')
      } finally {
        setActionBusy(false)
      }
    },
    [state.order],
  )

  const uploadDisputePhotos = useCallback(
    async (files: Blob[]): Promise<DisputePhotoDto[] | null> => {
      const disputeId = state.order?.dispute?.id
      if (!disputeId) return null
      const existing = state.order?.dispute?.photos?.length ?? 0
      const available = MAX_PHOTOS - existing
      if (available <= 0) {
        setActionError(`Достигнут лимит ${MAX_PHOTOS} фотографий`)
        return null
      }
      const toUpload = files.slice(0, available)
      setActionBusy(true)
      setActionError(null)
      try {
        const all: DisputePhotoDto[] = []
        for (let i = 0; i < toUpload.length; i += MAX_PER_REQUEST) {
          const batch = toUpload.slice(i, i + MAX_PER_REQUEST)
          const newPhotos = await DisputesService.postApiOrdersDisputesPhotos({
            disputeId,
            formData: { images: batch },
          })
          all.push(...newPhotos)
        }
        const prevDispute = state.order?.dispute
        if (prevDispute) {
          dispatch({
            type: 'patch',
            patch: {
              dispute: {
                ...prevDispute,
                photos: [...(prevDispute.photos ?? []), ...all],
              },
            },
          })
        }
        return all
      } catch {
        setActionError('Не удалось загрузить фото')
        return null
      } finally {
        setActionBusy(false)
      }
    },
    [state.order],
  )

  const deleteDisputePhoto = useCallback(
    async (photoId: string) => {
      const prevDispute = state.order?.dispute
      if (!prevDispute) return
      setActionBusy(true)
      setActionError(null)
      try {
        await DisputesService.deleteApiOrdersDisputesPhotos({ photoId })
        dispatch({
          type: 'patch',
          patch: {
            dispute: {
              ...prevDispute,
              photos: (prevDispute.photos ?? []).filter((p) => p.id !== photoId),
            },
          },
        })
      } catch {
        setActionError('Не удалось удалить фото')
      } finally {
        setActionBusy(false)
      }
    },
    [state.order],
  )

  return {
    order: state.order,
    loading: state.loading,
    error: state.error,
    actionBusy,
    actionError,
    reload,
    confirm,
    markReady,
    complete,
    cancel,
    openDispute,
    assignCourier,
    uploadPhotos,
    deletePhoto,
    uploadDisputePhotos,
    deleteDisputePhoto,
  }
}
