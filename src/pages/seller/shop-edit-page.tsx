import { useParams, Link } from 'react-router-dom'
import { useUnsavedGuard } from '@/hooks/use-unsaved-guard'
import { UnsavedChangesModal } from '@/components/ui/unsaved-changes-modal'
import {
  ArrowLeft,
  Save,
  Loader2,
  Store,
  MapPin,
  Truck,
  Camera,
  Image,
  Check,
  Map,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShopById } from '@/hooks/use-my-shops'
import { useShopForm } from '@/hooks/use-shop-form'
import { ShopAvatarSection } from '@/components/seller/shop-avatar-section'
import { ShopPhotosSection } from '@/components/seller/shop-photos-section'
import { ShopLocationModal } from '@/components/seller/shop-location-modal'
import { ProfileSelect } from '@/components/ui/profile-select'
import { BUSINESS_OPTIONS } from '@/lib/shop-form'
import { EMAIL_RE, PHONE_RE } from '@/lib/auth-validation'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full h-10 px-3 text-sm text-foreground bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50'
const inputErrorClass =
  'w-full h-10 px-3 text-sm text-foreground bg-background border border-destructive rounded-xl outline-none focus:ring-2 focus:ring-destructive/25 focus:border-destructive transition-all placeholder:text-muted-foreground/50'
const textareaClass =
  'w-full px-3 py-2.5 text-sm text-foreground bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 resize-none'
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'
const sectionClass = 'rounded-2xl border border-border bg-card/60 p-5 sm:p-6'
const sectionTitle = 'text-sm font-semibold text-foreground mb-4 flex items-center gap-2'

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer group"
    >
      <div
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-1'}`}
        />
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  )
}

export function ShopEditPage() {
  const { shopId } = useParams<{ shopId: string }>()
  const isEdit = !!shopId

  const { shop, setShop, loading: shopLoading, error: shopError } = useShopById(shopId)

  const {
    form,
    dispatch,
    fieldErrors,
    setFieldErrors,
    touched,
    touch,
    formatPhone,
    locationLabel,
    setLocationLabel,
    locationModalOpen,
    setLocationModalOpen,
    saving,
    saved,
    error,
    courierSaved,
    courierSaving,
    courierError,
    handlePhoneChange,
    handlePhoneKeyDown,
    handleInnChange,
    handleInnBlur,
    handleEmailChange,
    handleSubmit,
    handleSaveCourier,
    isDirty,
  } = useShopForm(shopId, shop, setShop)

  const blocker = useUnsavedGuard(isDirty)

  if (isEdit && shopLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-6 w-36 bg-muted rounded-xl" />
        <div className="rounded-2xl border border-border bg-card/60 h-48" />
        <div className="rounded-2xl border border-border bg-card/60 h-32" />
      </div>
    )
  }

  if (isEdit && (shopError || !shop)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">{shopError ?? 'Магазин не найден'}</p>
        <Link to="/seller/shops" className="text-sm text-primary hover:underline mt-2 inline-block">
          Назад к магазинам
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/seller/shops"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">
            {isEdit ? 'Редактировать магазин' : 'Новый магазин'}
          </h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
          className="space-y-4"
        >
          {/* Basic info */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>
              <Store className="w-4 h-4 text-muted-foreground" />
              Основное
            </h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>
                  Название магазина <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  maxLength={200}
                  onChange={(e) => {
                    dispatch({ type: 'patch', patch: { businessName: e.target.value } })
                    if (touched.businessName)
                      setFieldErrors((prev) => ({
                        ...prev,
                        businessName: e.target.value.trim() ? undefined : 'Обязательное поле',
                      }))
                  }}
                  onBlur={() => {
                    touch('businessName')
                    setFieldErrors((prev) => ({
                      ...prev,
                      businessName: form.businessName.trim() ? undefined : 'Обязательное поле',
                    }))
                  }}
                  placeholder="Пекарня у Ивановых"
                  className={
                    touched.businessName && fieldErrors.businessName ? inputErrorClass : inputClass
                  }
                />
                {touched.businessName && fieldErrors.businessName && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.businessName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Тип бизнеса</label>
                  <ProfileSelect
                    options={BUSINESS_OPTIONS}
                    value={form.businessType}
                    onChange={(v) =>
                      dispatch({
                        type: 'patch',
                        patch: { businessType: v as typeof form.businessType },
                      })
                    }
                    placeholder="Не указан"
                  />
                </div>
                <div>
                  <label className={labelClass}>ИНН</label>
                  <input
                    type="text"
                    value={form.inn}
                    onChange={handleInnChange}
                    onBlur={handleInnBlur}
                    placeholder="123456789012"
                    className={touched.inn && fieldErrors.inn ? inputErrorClass : inputClass}
                  />
                  {touched.inn && fieldErrors.inn && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.inn}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Телефон</label>
                  <input
                    type="tel"
                    value={formatPhone(form.phoneNumber)}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    onBlur={() => {
                      touch('phoneNumber')
                      setFieldErrors((prev) => ({
                        ...prev,
                        phoneNumber:
                          form.phoneNumber && !PHONE_RE.test(form.phoneNumber)
                            ? 'Введите все 10 цифр номера'
                            : undefined,
                      }))
                    }}
                    placeholder="+7(900)-123-45-67"
                    className={
                      touched.phoneNumber && fieldErrors.phoneNumber ? inputErrorClass : inputClass
                    }
                  />
                  {touched.phoneNumber && fieldErrors.phoneNumber && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleEmailChange}
                    onBlur={() => {
                      touch('email')
                      setFieldErrors((prev) => ({
                        ...prev,
                        email:
                          form.email && !EMAIL_RE.test(form.email)
                            ? 'Некорректный email'
                            : undefined,
                      }))
                    }}
                    placeholder="shop@example.com"
                    className={touched.email && fieldErrors.email ? inputErrorClass : inputClass}
                  />
                  {touched.email && fieldErrors.email && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    dispatch({ type: 'patch', patch: { description: e.target.value } })
                  }
                  placeholder="Расскажите о вашем магазине..."
                  rows={3}
                  className={textareaClass}
                />
              </div>

              <div>
                <label className={labelClass}>Часы работы</label>
                <input
                  type="text"
                  value={form.workingHours}
                  onChange={(e) =>
                    dispatch({ type: 'patch', patch: { workingHours: e.target.value } })
                  }
                  placeholder="Пн-Пт 10:00–18:00, Сб 11:00–16:00"
                  className={inputClass}
                />
              </div>

              {isEdit && (
                <Toggle
                  checked={form.isActive}
                  onChange={(v) => dispatch({ type: 'patch', patch: { isActive: v } })}
                  label="Магазин активен"
                />
              )}
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Местоположение
            </h2>

            {form.latitude !== null && form.longitude !== null && (
              <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border space-y-1">
                {locationLabel && (
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">
                    {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                  </span>
                  {form.serviceRadiusMeters !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Радиус:{' '}
                      {form.serviceRadiusMeters >= 1000
                        ? `${form.serviceRadiusMeters / 1000} км`
                        : `${form.serviceRadiusMeters} м`}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Map className="w-4 h-4 text-muted-foreground" />
              {form.latitude !== null ? 'Изменить на карте' : 'Выбрать на карте'}
            </button>

            {locationModalOpen && (
              <ShopLocationModal
                initialLat={form.latitude}
                initialLng={form.longitude}
                initialRadiusMeters={form.serviceRadiusMeters}
                onClose={() => setLocationModalOpen(false)}
                onSave={(lat, lng, radius, lbl) => {
                  dispatch({
                    type: 'patch',
                    patch: { latitude: lat, longitude: lng, serviceRadiusMeters: radius },
                  })
                  setLocationLabel(lbl)
                  setLocationModalOpen(false)
                }}
              />
            )}
          </div>

          {/* Error + Save */}
          {error && <p className="text-xs text-destructive px-1">{error}</p>}
          <motion.button
            type="submit"
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Сохранено
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Сохранить' : 'Создать магазин'}
              </>
            )}
          </motion.button>
        </form>

        {/* Photo sections — only after creation */}
        {isEdit && shopId && (
          <>
            <div className={sectionClass}>
              <h2 className={sectionTitle}>
                <Camera className="w-4 h-4 text-muted-foreground" />
                Аватар
              </h2>
              <ShopAvatarSection
                shopId={shopId}
                avatarUrl={form.avatarUrl}
                businessName={form.businessName}
                onUpdate={(url) => dispatch({ type: 'patch', patch: { avatarUrl: url } })}
              />
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitle}>
                <Image className="w-4 h-4 text-muted-foreground" />
                Фотогалерея
                {form.photos.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({form.photos.length}/50)
                  </span>
                )}
              </h2>
              {form.photos.length === 0 && (
                <p className="text-xs text-muted-foreground mb-3">
                  Перетащите фото сюда или нажмите «Добавить» · до 10 файлов за раз · JPEG, PNG,
                  WEBP, GIF · до 10 МБ каждый
                </p>
              )}
              <ShopPhotosSection
                shopId={shopId}
                photos={form.photos}
                onUpdate={(p) => dispatch({ type: 'patch', patch: { photos: p } })}
              />
            </div>

            <div className={sectionClass}>
              <h2 className={sectionTitle}>
                <Truck className="w-4 h-4 text-muted-foreground" />
                Курьерская доставка
              </h2>
              <div className="space-y-3">
                <Toggle
                  checked={form.allowCourier}
                  onChange={(v) => dispatch({ type: 'patch', patch: { allowCourier: v } })}
                  label="Разрешить курьерскую доставку"
                />
                <AnimatePresence>
                  {form.allowCourier && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <label className={labelClass}>Максимальная дистанция (метры)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.maxCourierMeters}
                        onChange={(e) =>
                          dispatch({ type: 'patch', patch: { maxCourierMeters: e.target.value } })
                        }
                        placeholder="5000"
                        className={cn(inputClass, 'input-no-spin')}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {courierError && <p className="text-xs text-destructive">{courierError}</p>}
                <motion.button
                  type="button"
                  onClick={() => void handleSaveCourier()}
                  disabled={courierSaving}
                  whileTap={{ scale: 0.97 }}
                  className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {courierSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : courierSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Сохранено
                    </>
                  ) : (
                    'Сохранить доставку'
                  )}
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
      <UnsavedChangesModal blocker={blocker} />
    </>
  )
}
