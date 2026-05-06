import { useReducer, useState, useEffect, useCallback } from 'react'
import { ShopsService } from '@/api/catalog'
import type { ShopDto } from '@/api/catalog'

type ShopsState = { shops: ShopDto[]; loading: boolean; error: string | null }
type ShopsAction =
  | { type: 'loading' }
  | { type: 'success'; shops: ShopDto[] }
  | { type: 'error'; message: string }

function shopsReducer(s: ShopsState, a: ShopsAction): ShopsState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { shops: a.shops, loading: false, error: null }
  return { ...s, loading: false, error: a.message }
}

export function useMyShops() {
  const [state, dispatch] = useReducer(shopsReducer, { shops: [], loading: true, error: null })
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    ShopsService.getApiCatalogShopsMy()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'success', shops: data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить магазины' })
      })
    return () => {
      cancelled = true
    }
  }, [version])

  return { shops: state.shops, loading: state.loading, error: state.error, reload }
}

type ShopState = { shop: ShopDto | null; loading: boolean; error: string | null }
type ShopAction =
  | { type: 'loading' }
  | { type: 'success'; shop: ShopDto }
  | { type: 'error'; message: string }
  | { type: 'set'; shop: ShopDto }

function shopReducer(s: ShopState, a: ShopAction): ShopState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { shop: a.shop, loading: false, error: null }
  if (a.type === 'set') return { ...s, shop: a.shop }
  return { ...s, loading: false, error: a.message }
}

export function useShopById(shopId: string | undefined) {
  const [state, dispatch] = useReducer(shopReducer, { shop: null, loading: !!shopId, error: null })

  useEffect(() => {
    if (!shopId) return
    let cancelled = false
    dispatch({ type: 'loading' })
    ShopsService.getApiCatalogShops({ id: shopId })
      .then((data) => {
        if (!cancelled) dispatch({ type: 'success', shop: data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error', message: 'Не удалось загрузить магазин' })
      })
    return () => {
      cancelled = true
    }
  }, [shopId])

  const setShop = useCallback((shop: ShopDto) => dispatch({ type: 'set', shop }), [])

  return { shop: state.shop, setShop, loading: state.loading, error: state.error }
}
