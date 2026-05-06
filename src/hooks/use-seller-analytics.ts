import { useReducer, useEffect, useCallback } from 'react'
import { SellerDashboardService } from '@/api/analytics'
import type {
  SellerSalesSummaryDto,
  TopProductDto,
  SellerRatingHistoryDto,
  SellerProductRatingsDto,
  StockAlertDto,
  PeriodType,
} from '@/api/analytics'

// ── Sales ─────────────────────────────────────────────────────────────────────

type SalesState = { data: SellerSalesSummaryDto | null; loading: boolean; error: string | null }
type SalesAction =
  | { type: 'loading' }
  | { type: 'success'; data: SellerSalesSummaryDto }
  | { type: 'error' }

function salesReducer(s: SalesState, a: SalesAction): SalesState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { data: a.data, loading: false, error: null }
  return { ...s, loading: false, error: 'Не удалось загрузить данные продаж' }
}

export function useSalesSummary(period: PeriodType | undefined) {
  const [state, dispatch] = useReducer(salesReducer, { data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    SellerDashboardService.getApiAnalyticsSellerDashboardSales({ period })
      .then((data) => {
        if (!cancelled) dispatch({ type: 'success', data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [period])

  return state
}

// ── Top Products ──────────────────────────────────────────────────────────────

type TopProductsState = { products: TopProductDto[]; loading: boolean; error: string | null }
type TopProductsAction =
  | { type: 'loading' }
  | { type: 'success'; products: TopProductDto[] }
  | { type: 'error' }

function topProductsReducer(s: TopProductsState, a: TopProductsAction): TopProductsState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { products: a.products, loading: false, error: null }
  return { ...s, loading: false, error: 'Не удалось загрузить топ товаров' }
}

export function useTopProducts(period: PeriodType | undefined, top: number) {
  const [state, dispatch] = useReducer(topProductsReducer, {
    products: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    SellerDashboardService.getApiAnalyticsSellerDashboardTopProducts({ period, top })
      .then((products) => {
        if (!cancelled) dispatch({ type: 'success', products })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [period, top])

  return state
}

// ── Rating History ────────────────────────────────────────────────────────────

type RatingHistoryState = {
  history: SellerRatingHistoryDto[]
  loading: boolean
  error: string | null
}
type RatingHistoryAction =
  | { type: 'loading' }
  | { type: 'success'; history: SellerRatingHistoryDto[] }
  | { type: 'error' }

function ratingHistoryReducer(s: RatingHistoryState, a: RatingHistoryAction): RatingHistoryState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { history: a.history, loading: false, error: null }
  return { ...s, loading: false, error: 'Не удалось загрузить историю рейтинга' }
}

export function useRatingHistory(days: number | undefined) {
  const [state, dispatch] = useReducer(ratingHistoryReducer, {
    history: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    SellerDashboardService.getApiAnalyticsSellerDashboardRatingHistory({ days })
      .then((history) => {
        if (!cancelled) dispatch({ type: 'success', history })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [days])

  return state
}

// ── Product Ratings ───────────────────────────────────────────────────────────

type ProductRatingsState = {
  data: SellerProductRatingsDto | null
  loading: boolean
  error: string | null
}
type ProductRatingsAction =
  | { type: 'loading' }
  | { type: 'success'; data: SellerProductRatingsDto }
  | { type: 'error' }

function productRatingsReducer(
  s: ProductRatingsState,
  a: ProductRatingsAction,
): ProductRatingsState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { data: a.data, loading: false, error: null }
  return { ...s, loading: false, error: 'Не удалось загрузить рейтинги товаров' }
}

export function useProductRatings() {
  const [state, dispatch] = useReducer(productRatingsReducer, {
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    SellerDashboardService.getApiAnalyticsSellerDashboardProductRatings()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'success', data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

// ── Stock Alerts ──────────────────────────────────────────────────────────────

type StockAlertsState = {
  alerts: StockAlertDto[]
  loading: boolean
  error: string | null
  acknowledging: string | null
}
type StockAlertsAction =
  | { type: 'loading' }
  | { type: 'success'; alerts: StockAlertDto[] }
  | { type: 'error' }
  | { type: 'acking'; id: string | null }
  | { type: 'acked'; id: string }

function stockAlertsReducer(s: StockAlertsState, a: StockAlertsAction): StockAlertsState {
  if (a.type === 'loading') return { ...s, loading: true, error: null }
  if (a.type === 'success') return { ...s, alerts: a.alerts, loading: false, error: null }
  if (a.type === 'error') return { ...s, loading: false, error: 'Не удалось загрузить оповещения' }
  if (a.type === 'acking') return { ...s, acknowledging: a.id }
  if (a.type === 'acked')
    return {
      ...s,
      acknowledging: null,
      alerts: s.alerts.map((al) => (al.id === a.id ? { ...al, isAcknowledged: true } : al)),
    }
  return s
}

export function useStockAlerts(onlyUnacknowledged: boolean) {
  const [state, dispatch] = useReducer(stockAlertsReducer, {
    alerts: [],
    loading: true,
    error: null,
    acknowledging: null,
  })

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    SellerDashboardService.getApiAnalyticsSellerDashboardStockAlerts({ onlyUnacknowledged })
      .then((alerts) => {
        if (!cancelled) dispatch({ type: 'success', alerts })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [onlyUnacknowledged])

  const acknowledge = useCallback(async (id: string) => {
    dispatch({ type: 'acking', id })
    try {
      await SellerDashboardService.postApiAnalyticsSellerDashboardStockAlertsAcknowledge({ id })
      dispatch({ type: 'acked', id })
    } catch {
      dispatch({ type: 'acking', id: null })
    }
  }, [])

  return { ...state, acknowledge }
}
