import { useState, useEffect, useReducer } from 'react'
import {
  MapPin,
  Save,
  Loader2,
  AlertTriangle,
  Pause,
  Play,
  X,
  Package,
  Clock,
  Star,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCourierProfile } from '@/hooks/use-courier-profile'
import { useUnsavedGuard } from '@/hooks/use-unsaved-guard'
import { UnsavedChangesModal } from '@/components/ui/unsaved-changes-modal'
import { CourierLocationModal } from '@/components/courier/courier-location-modal'
import { useAuth } from '@/contexts/auth-context'
import { useAddresses } from '@/contexts/addresses-context'
import { cn } from '@/lib/utils'
import type { UserAddressDto } from '@/api/identity'

const RADIUS_PRESETS = [50, 100, 200, 500, 1000, 2000, 3000]
const RADIUS_MIN = 50
const RADIUS_MAX = 10000

function formatMeters(m: number): string {
  return m >= 1000 ? `${m / 1000} км` : `${m} м`
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {label === 'Заказы' ? (
          <Package className="w-6 h-6 text-muted-foreground" />
        ) : label === 'История' ? (
          <Clock className="w-6 h-6 text-muted-foreground" />
        ) : (
          <Star className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <p className="text-base font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground mt-1">Раздел находится в разработке</p>
    </div>
  )
}

export { ComingSoon as CourierComingSoon }

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4 animate-pulse">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="h-4 w-32 bg-muted rounded-full mb-5" />
        <div className="h-10 bg-muted rounded-xl mb-3" />
        <div className="h-4 w-40 bg-muted rounded-full mb-5" />
        <div className="h-10 bg-muted rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="h-4 w-32 bg-muted rounded-full mb-4" />
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

type FormState = {
  isActive: boolean
  radiusMeters: number
  radiusInput: string
  lat: number | null
  lng: number | null
  locationLabel: string
  initialized: boolean
}

type FormAction =
  | {
      type: 'init'
      isActive: boolean
      radiusMeters: number
      lat: number | null
      lng: number | null
      locationLabel: string
    }
  | { type: 'setIsActive'; value: boolean }
  | { type: 'setRadius'; value: number }
  | { type: 'setRadiusInput'; value: string }
  | { type: 'setLocation'; lat: number; lng: number; label: string }
  | { type: 'clearLocation' }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'init':
      return {
        isActive: action.isActive,
        radiusMeters: action.radiusMeters,
        radiusInput: action.radiusMeters.toString(),
        lat: action.lat,
        lng: action.lng,
        locationLabel: action.locationLabel,
        initialized: true,
      }
    case 'setIsActive':
      return { ...state, isActive: action.value }
    case 'setRadius':
      return { ...state, radiusMeters: action.value, radiusInput: action.value.toString() }
    case 'setRadiusInput': {
      const parsed = parseInt(action.value, 10)
      const valid = !isNaN(parsed) && parsed >= 50 && parsed <= 10000
      return {
        ...state,
        radiusInput: action.value,
        radiusMeters: valid ? parsed : state.radiusMeters,
      }
    }
    case 'setLocation':
      return { ...state, lat: action.lat, lng: action.lng, locationLabel: action.label }
    case 'clearLocation':
      return { ...state, lat: null, lng: null, locationLabel: '' }
  }
}

export function CourierProfilePage() {
  const { profile, loading, error, updateProfile, resign } = useCourierProfile()
  const { refreshUser } = useAuth()
  const { addresses } = useAddresses()
  const navigate = useNavigate()

  const [form, dispatch] = useReducer(formReducer, {
    isActive: true,
    radiusMeters: 5000,
    radiusInput: '5000',
    lat: null,
    lng: null,
    locationLabel: '',
    initialized: false,
  })

  const [showLocationModal, setShowLocationModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [resignConfirming, setResignConfirming] = useState(false)
  const [resigning, setResigning] = useState(false)
  const [resignError, setResignError] = useState<string | null>(null)

  useEffect(() => {
    if (profile && !form.initialized) {
      const baseLat = profile.baseLatitude ?? null
      const baseLng = profile.baseLongitude ?? null
      dispatch({
        type: 'init',
        isActive: profile.isActive ?? true,
        radiusMeters: profile.serviceRadiusMeters ?? 5000,
        lat: baseLat,
        lng: baseLng,
        locationLabel:
          baseLat !== null && baseLng !== null
            ? `${baseLat.toFixed(5)}, ${baseLng.toFixed(5)}`
            : '',
      })
    }
  }, [profile, form.initialized])

  const { isActive, radiusMeters, radiusInput, lat, lng, locationLabel, initialized } = form

  const radiusInputInvalid =
    !radiusInput ||
    isNaN(parseInt(radiusInput, 10)) ||
    parseInt(radiusInput, 10) < RADIUS_MIN ||
    parseInt(radiusInput, 10) > RADIUS_MAX

  const isDirty =
    initialized &&
    (isActive !== (profile?.isActive ?? true) ||
      radiusMeters !== (profile?.serviceRadiusMeters ?? 5000) ||
      lat !== (profile?.baseLatitude ?? null) ||
      lng !== (profile?.baseLongitude ?? null))

  const blocker = useUnsavedGuard(isDirty)

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateProfile({
        isActive,
        serviceRadiusMeters: radiusMeters,
        latitude: lat,
        longitude: lng,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch {
      setSaveError('Не удалось сохранить. Попробуйте позже.')
    } finally {
      setSaving(false)
    }
  }

  const handleResign = async () => {
    setResigning(true)
    setResignError(null)
    try {
      await resign()
      // Reset form (isDirty → false) before navigation so unsaved-guard doesn't block
      dispatch({ type: 'init', isActive, radiusMeters, lat, lng, locationLabel })
      await refreshUser()
      navigate('/profile', { replace: true })
    } catch {
      setResignError('Не удалось отказаться от роли. Попробуйте позже.')
      setResigning(false)
    }
  }

  if (loading) return <ProfileSkeleton />

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{error ?? 'Профиль не найден'}</p>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4">
        {/* ── Status ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Статус доставки</h2>

          <button
            type="button"
            onClick={() => dispatch({ type: 'setIsActive', value: !isActive })}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors cursor-pointer',
              isActive
                ? 'border-primary/30 bg-primary/8 hover:bg-primary/12'
                : 'border-border bg-muted/30 hover:bg-muted/50',
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                isActive ? 'bg-primary/15' : 'bg-muted',
              )}
            >
              {isActive ? (
                <Play className="w-4 h-4 text-primary" />
              ) : (
                <Pause className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p
                className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {isActive ? 'Принимаю заказы' : 'Пауза'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isActive
                  ? 'Вы видны покупателям и получаете заказы'
                  : 'Заказы не поступают, вы скрыты'}
              </p>
            </div>
            <div
              className={cn(
                'w-10 h-6 rounded-full flex items-center transition-colors shrink-0',
                isActive
                  ? 'bg-primary justify-end pr-0.5'
                  : 'bg-muted-foreground/30 justify-start pl-0.5',
              )}
            >
              <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
            </div>
          </button>
        </div>

        {/* ── Radius ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Радиус доставки</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Заказы из магазинов в этом радиусе от вашей базовой точки
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {RADIUS_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => dispatch({ type: 'setRadius', value: r })}
                className={cn(
                  'h-8 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer',
                  radiusMeters === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {formatMeters(r)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={radiusInput}
              onChange={(e) => dispatch({ type: 'setRadiusInput', value: e.target.value })}
              className={cn(
                'flex-1 h-9 px-3 rounded-xl border bg-background text-sm text-foreground focus:outline-none transition-colors',
                radiusInputInvalid
                  ? 'border-destructive/60 focus:border-destructive'
                  : 'border-border focus:border-primary/50',
              )}
            />
            <span className="text-sm text-muted-foreground shrink-0">м</span>
          </div>
          {radiusInputInvalid && (
            <p className="text-xs text-destructive mt-1.5">
              Введите значение от {RADIUS_MIN} до {RADIUS_MAX} м
            </p>
          )}
        </div>

        {/* ── Base location ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Базовая точка</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Откуда вы начинаете маршрут. Влияет на то, какие заказы вам предлагаются.
          </p>

          {/* Selected location */}
          {lat !== null && lng !== null ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/25 bg-primary/5 mb-4">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {locationLabel || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'clearLocation' })}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border mb-4">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">Базовая точка не указана</p>
            </div>
          )}

          {/* Saved addresses */}
          {addresses.filter((a) => a.latitude != null && a.longitude != null).length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Из моих адресов</p>
              <div className="flex flex-col gap-1.5">
                {addresses
                  .filter((a) => a.latitude != null && a.longitude != null)
                  .map((a: UserAddressDto) => {
                    const isSelected = lat === a.latitude && lng === a.longitude
                    const addrLabel =
                      a.title ||
                      [a.street, a.houseNumber].filter(Boolean).join(', ') ||
                      a.city ||
                      'Адрес'
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: 'setLocation',
                            lat: a.latitude!,
                            lng: a.longitude!,
                            label: addrLabel,
                          })
                        }
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'border-primary/40 bg-primary/8 text-foreground'
                            : 'border-border hover:border-primary/30 hover:bg-muted/40 text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <MapPin
                          className={cn(
                            'w-3.5 h-3.5 shrink-0',
                            isSelected ? 'text-primary' : 'text-muted-foreground',
                          )}
                        />
                        <span className="text-sm truncate">{addrLabel}</span>
                        {a.isDefault && (
                          <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                            основной
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Map picker */}
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            {lat !== null ? 'Изменить на карте' : 'Выбрать на карте'}
          </button>
        </div>

        {/* ── Save ── */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {saveError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-sm text-destructive"
              >
                {saveError}
              </motion.p>
            )}
            {saveSuccess && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-sm text-primary"
              >
                Сохранено
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !isDirty || radiusInputInvalid}
            className="ml-auto flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </button>
        </div>

        {/* ── Resign ── */}
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Отказаться от роли курьера</h2>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Профиль курьера и все настройки будут удалены. Вы сможете зарегистрироваться снова в
            любой момент через раздел профиля.
          </p>

          <AnimatePresence>
            {resignConfirming && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mb-4 p-3 rounded-xl bg-destructive/8 border border-destructive/20 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive leading-relaxed">
                    Это действие нельзя отменить. Ваш профиль курьера будет удалён, и вы
                    автоматически перейдёте на страницу профиля.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {resignError && <p className="text-xs text-destructive mb-3">{resignError}</p>}

          <div className="flex items-center justify-end gap-3">
            {resignConfirming ? (
              <>
                <button
                  type="button"
                  onClick={() => setResignConfirming(false)}
                  disabled={resigning}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => void handleResign()}
                  disabled={resigning}
                  className="h-8 px-4 rounded-xl border border-destructive/40 text-destructive text-xs font-medium flex items-center gap-1.5 hover:bg-destructive/8 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {resigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Да, отказаться'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setResignConfirming(true)}
                className="h-8 px-4 rounded-xl border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/8 transition-colors cursor-pointer"
              >
                Отказаться от роли
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLocationModal && (
          <CourierLocationModal
            initialLat={lat}
            initialLng={lng}
            addresses={addresses}
            radiusMeters={radiusMeters}
            onClose={() => setShowLocationModal(false)}
            onSave={(newLat, newLng, newLabel) => {
              dispatch({ type: 'setLocation', lat: newLat, lng: newLng, label: newLabel })
              setShowLocationModal(false)
            }}
          />
        )}
      </AnimatePresence>

      <UnsavedChangesModal blocker={blocker} />
    </>
  )
}
