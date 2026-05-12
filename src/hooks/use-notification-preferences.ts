import { useReducer, useEffect, useCallback } from 'react'
import { NotificationsService } from '@/api/notifications'
import type { NotificationPreferenceDto, UpdatePreferencesRequest } from '@/api/notifications'

interface State {
  prefs: NotificationPreferenceDto | null
  loading: boolean
  saving: boolean
  error: string | null
}

type Action =
  | { type: 'loaded'; prefs: NotificationPreferenceDto }
  | { type: 'load_error' }
  | { type: 'saving' }
  | { type: 'saved'; prefs: NotificationPreferenceDto }
  | { type: 'save_error' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      return { ...state, loading: false, prefs: action.prefs }
    case 'load_error':
      return { ...state, loading: false, error: 'Не удалось загрузить настройки' }
    case 'saving':
      return { ...state, saving: true, error: null }
    case 'saved':
      return { ...state, saving: false, prefs: action.prefs }
    case 'save_error':
      return { ...state, saving: false, error: 'Не удалось сохранить настройки' }
  }
}

export function useNotificationPreferences() {
  const [{ prefs, loading, saving, error }, dispatch] = useReducer(reducer, {
    prefs: null,
    loading: true,
    saving: false,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    NotificationsService.getApiNotificationsNotificationsPreferences()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'loaded', prefs: data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'load_error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updatePreferences = useCallback(async (updates: UpdatePreferencesRequest) => {
    dispatch({ type: 'saving' })
    try {
      const updated = await NotificationsService.putApiNotificationsNotificationsPreferences({
        requestBody: updates,
      })
      dispatch({ type: 'saved', prefs: updated })
      return true
    } catch {
      dispatch({ type: 'save_error' })
      return false
    }
  }, [])

  return { prefs, loading, saving, error, updatePreferences }
}
