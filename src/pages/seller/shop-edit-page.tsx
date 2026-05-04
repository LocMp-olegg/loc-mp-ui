import React, { useReducer, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Save, Loader2, Store, MapPin, Truck, Camera,
  Image, Plus, Check, Map,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShopsService } from '@/api/catalog'
import type { BusinessType, ShopPhotoDto, ShopDto } from '@/api/catalog'
import { useShopById } from '@/hooks/use-my-shops'
import { ProfileSelect } from '@/components/ui/profile-select'
import { PhotoEditorModal } from '@/components/profile/photo-editor-modal'
import { ShopLocationModal } from '@/components/seller/shop-location-modal'
import { ShopPhotoModal } from '@/components/seller/shop-photo-modal'
import { reverseGeocode } from '@/lib/geo'
import { formatPhone, EMAIL_RE, PHONE_RE } from '@/lib/auth-validation'

const INN_RE = /^(\d{10}|\d{12})$/
import { cn } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'

const MAX_PHOTOS = 50

const BUSINESS_OPTIONS = [
  { value: '', label: 'Не указан' },
  { value: 'Individual', label: 'Частное лицо' },
  { value: 'SoleProprietor', label: 'ИП' },
  { value: 'SmallBusiness', label: 'ООО / компания' },
]

const inputClass =
  'w-full h-10 px-3 text-sm text-foreground bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50'
const inputErrorClass =
  'w-full h-10 px-3 text-sm text-foreground bg-background border border-destructive rounded-xl outline-none focus:ring-2 focus:ring-destructive/25 focus:border-destructive transition-all placeholder:text-muted-foreground/50'
const textareaClass =
  'w-full px-3 py-2.5 text-sm text-foreground bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 resize-none'
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'
const sectionClass = 'rounded-2xl border border-border bg-card/60 p-5 sm:p-6'
const sectionTitle = 'text-sm font-semibold text-foreground mb-4 flex items-center gap-2'

type FormState = {
  businessName: string
  businessType: BusinessType | ''
  phoneNumber: string
  email: string
  inn: string
  description: string
  workingHours: string
  isActive: boolean
  latitude: number | null
  longitude: number | null
  serviceRadiusMeters: number | null
  allowCourier: boolean
  maxCourierMeters: string
  avatarUrl: string | null
  photos: ShopPhotoDto[]
}

const INIT_FORM: FormState = {
  businessName: '',
  businessType: '',
  phoneNumber: '',
  email: '',
  inn: '',
  description: '',
  workingHours: '',
  isActive: true,
  latitude: null,
  longitude: null,
  serviceRadiusMeters: null,
  allowCourier: false,
  maxCourierMeters: '',
  avatarUrl: null,
  photos: [],
}

type FormAction =
  | { type: 'init'; shop: ShopDto }
  | { type: 'patch'; patch: Partial<FormState> }

function formReducer(state: FormState, action: FormAction): FormState {
  if (action.type === 'init') {
    const rawPhone = (action.shop.phoneNumber ?? '').replace(/\D/g, '')
    return {
      businessName: action.shop.businessName ?? '',
      businessType: (['Individual', 'SoleProprietor', 'SmallBusiness'] as string[]).includes(
        action.shop.businessType as string,
      )
        ? (action.shop.businessType as BusinessType)
        : '',
      phoneNumber: rawPhone.startsWith('7') ? rawPhone.slice(1) : rawPhone,
      email: action.shop.email ?? '',
      inn: action.shop.inn ?? '',
      description: action.shop.description ?? '',
      workingHours: action.shop.workingHours ?? '',
      isActive: action.shop.isActive ?? true,
      latitude: action.shop.latitude ?? null,
      longitude: action.shop.longitude ?? null,
      serviceRadiusMeters: action.shop.serviceRadiusMeters ?? null,
      allowCourier: action.shop.allowCourierDelivery ?? false,
      maxCourierMeters: action.shop.maxCourierDistanceMeters?.toString() ?? '',
      avatarUrl: action.shop.avatarUrl ?? null,
      photos: action.shop.photos ?? [],
    }
  }
  return { ...state, ...action.patch }
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
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

function AvatarSection({
  shopId,
  avatarUrl,
  businessName,
  onUpdate,
}: {
  shopId: string
  avatarUrl: string | null | undefined
  businessName: string
  onUpdate: (url: string) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setError(null)
    const updated = await ShopsService.postApiCatalogShopsAvatar({
      id: shopId,
      formData: { image: file },
    })
    if (updated.avatarUrl) onUpdate(updated.avatarUrl)
  }

  return (
    <>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border cursor-pointer shrink-0"
          aria-label="Изменить аватар магазина"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Аватар магазина" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">Аватар магазина</p>
          <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP · до 5 МБ</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer mt-1"
          >
            {avatarUrl ? 'Заменить' : 'Загрузить'}
          </button>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      </div>
      <PhotoEditorModal
        open={modalOpen}
        hasPhoto={!!avatarUrl}
        photoUrl={avatarUrl ?? null}
        userName={businessName || null}
        title="Аватар магазина"
        onClose={() => setModalOpen(false)}
        onUpload={async (file) => {
          try {
            await handleUpload(file)
          } catch {
            setError('Не удалось загрузить аватар')
            throw new Error('upload failed')
          }
        }}
      />
    </>
  )
}

function PhotosSection({
  shopId,
  photos,
  onUpdate,
}: {
  shopId: string
  photos: ShopPhotoDto[]
  onUpdate: (photos: ShopPhotoDto[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<ShopPhotoDto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList) => {
    const available = MAX_PHOTOS - photos.length
    if (available <= 0) return
    setUploading(true)
    setError(null)
    try {
      const allFiles = Array.from(files).slice(0, available) as Blob[]
      const accumulated: ShopPhotoDto[] = []
      for (let i = 0; i < allFiles.length; i += 10) {
        const batch = allFiles.slice(i, i + 10)
        const newPhotos = await ShopsService.postApiCatalogShopsPhotos({
          id: shopId,
          formData: { images: batch },
        })
        accumulated.push(...newPhotos)
      }
      onUpdate([...photos, ...accumulated])
    } catch {
      setError('Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) void handleUpload(e.dataTransfer.files)
  }

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        dragging && 'ring-2 ring-primary/50 bg-primary/5',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:opacity-85 transition-opacity cursor-pointer"
          >
            <img
              src={photo.storageUrl ?? noImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground leading-tight">
              {dragging ? 'Отпустите' : 'Добавить'}
            </span>
          </button>
        )}
      </div>

      {photos.length >= MAX_PHOTOS && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Достигнут лимит {MAX_PHOTOS} фотографий
        </p>
      )}
      {dragging && photos.length < MAX_PHOTOS && (
        <p className="text-xs text-primary text-center py-1 font-medium">
          Перетащите файлы для загрузки
        </p>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleUpload(e.target.files)
          e.target.value = ''
        }}
      />

      {selectedPhoto && (
        <ShopPhotoModal
          photo={selectedPhoto}
          shopId={shopId}
          onClose={() => setSelectedPhoto(null)}
          onDelete={(id) => {
            onUpdate(photos.filter((p) => p.id !== id))
            setSelectedPhoto(null)
          }}
          onReplace={(oldId, newPhoto) => {
            onUpdate(photos.map((p) => (p.id === oldId ? newPhoto : p)))
            setSelectedPhoto(null)
          }}
        />
      )}
    </div>
  )
}

export function ShopEditPage() {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const isEdit = !!shopId

  const { shop, setShop, loading: shopLoading, error: shopError } = useShopById(shopId)

  const [fieldErrors, setFieldErrors] = useState<{ businessName?: string; phoneNumber?: string; email?: string; inn?: string }>({})
  const [touched, setTouched] = useState<Partial<Record<'businessName' | 'phoneNumber' | 'email' | 'inn', boolean>>>({})

  const touch = (f: 'businessName' | 'phoneNumber' | 'email' | 'inn') =>
    setTouched((t) => ({ ...t, [f]: true }))

  const [form, dispatch] = useReducer(formReducer, INIT_FORM)

  const [locationLabel, setLocationLabel] = useState('')
  const [locationModalOpen, setLocationModalOpen] = useState(false)

  const [courierSaved, setCourierSaved] = useState(false)
  const [courierSaving, setCourierSaving] = useState(false)
  const [courierError, setCourierError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFields = (name: string, phone: string, mail: string, inn: string) => {
    const e: { businessName?: string; phoneNumber?: string; email?: string; inn?: string } = {}
    if (!name.trim()) e.businessName = 'Обязательное поле'
    else if (name.length > 200) e.businessName = 'Максимум 200 символов'
    if (phone && !PHONE_RE.test(phone)) e.phoneNumber = 'Введите все 10 цифр номера'
    if (mail && !EMAIL_RE.test(mail)) e.email = 'Некорректный email'
    if (inn && !INN_RE.test(inn)) e.inn = 'ИНН — 10 (юрлицо) или 12 (физлицо) цифр'
    return e
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allDigits = e.target.value.replace(/\D/g, '')
    const digits = allDigits.startsWith('7') ? allDigits.slice(1) : allDigits
    const next = digits.slice(0, 10)
    dispatch({ type: 'patch', patch: { phoneNumber: next } })
    if (touched.phoneNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        phoneNumber: next && !PHONE_RE.test(next) ? 'Введите все 10 цифр номера' : undefined,
      }))
    }
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      dispatch({ type: 'patch', patch: { phoneNumber: form.phoneNumber.slice(0, -1) } })
    }
  }

  useEffect(() => {
    if (!shop) return
    dispatch({ type: 'init', shop })
    if (shop.latitude && shop.longitude) {
      reverseGeocode(shop.latitude, shop.longitude).then(setLocationLabel)
    }
  }, [shop])

  const handleSubmit = async () => {
    if (saving) return
    const errs = validateFields(form.businessName, form.phoneNumber, form.email, form.inn)
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      setTouched({ businessName: true, phoneNumber: true, email: true, inn: true })
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)

    const payload = {
      businessName: form.businessName || null,
      businessType: (form.businessType as BusinessType) || undefined,
      phoneNumber: form.phoneNumber || null,
      email: form.email || null,
      inn: form.inn || null,
      description: form.description || null,
      workingHours: form.workingHours || null,
      serviceRadiusMeters: form.serviceRadiusMeters ?? null,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
    }

    try {
      if (isEdit && shopId) {
        const updated = await ShopsService.putApiCatalogShops({
          id: shopId,
          requestBody: { ...payload, isActive: form.isActive },
        })
        setShop(updated)
      } else {
        const created = await ShopsService.postApiCatalogShops({ requestBody: payload })
        navigate(`/seller/shops/${created.id}/edit`, { replace: true })
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Не удалось сохранить магазин')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCourier = async () => {
    if (!shopId || courierSaving) return
    setCourierSaving(true)
    setCourierError(null)
    try {
      await ShopsService.patchApiCatalogShopsCourierDelivery({
        id: shopId,
        requestBody: {
          allow: form.allowCourier,
          maxDistanceMeters: form.allowCourier && form.maxCourierMeters ? Number(form.maxCourierMeters) : null,
        },
      })
      setCourierSaved(true)
      setTimeout(() => setCourierSaved(false), 2500)
    } catch {
      setCourierError('Не удалось сохранить настройки доставки')
    } finally {
      setCourierSaving(false)
    }
  }

  function formatRadius(meters: number): string {
    return meters >= 1000 ? `${meters / 1000} км` : `${meters} м`
  }

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

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="space-y-4">
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
                    setFieldErrors((prev) => ({ ...prev, businessName: e.target.value.trim() ? undefined : 'Обязательное поле' }))
                }}
                onBlur={() => {
                  touch('businessName')
                  setFieldErrors((prev) => ({ ...prev, businessName: form.businessName.trim() ? undefined : 'Обязательное поле' }))
                }}
                placeholder="Пекарня у Ивановых"
                className={touched.businessName && fieldErrors.businessName ? inputErrorClass : inputClass}
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
                  onChange={(v) => dispatch({ type: 'patch', patch: { businessType: v as BusinessType | '' } })}
                  placeholder="Не указан"
                />
              </div>
              <div>
                <label className={labelClass}>ИНН</label>
                <input
                  type="text"
                  value={form.inn}
                  onChange={(e) => {
                    dispatch({ type: 'patch', patch: { inn: e.target.value } })
                    if (touched.inn)
                      setFieldErrors((prev) => ({
                        ...prev,
                        inn: e.target.value && !INN_RE.test(e.target.value)
                          ? 'ИНН — 10 (юрлицо) или 12 (физлицо) цифр'
                          : undefined,
                      }))
                  }}
                  onBlur={() => {
                    touch('inn')
                    setFieldErrors((prev) => ({
                      ...prev,
                      inn: form.inn && !INN_RE.test(form.inn)
                        ? 'ИНН — 10 (юрлицо) или 12 (физлицо) цифр'
                        : undefined,
                    }))
                  }}
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
                      phoneNumber: form.phoneNumber && !PHONE_RE.test(form.phoneNumber) ? 'Введите все 10 цифр номера' : undefined,
                    }))
                  }}
                  placeholder="+7(900)-123-45-67"
                  className={touched.phoneNumber && fieldErrors.phoneNumber ? inputErrorClass : inputClass}
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
                  onChange={(e) => {
                    dispatch({ type: 'patch', patch: { email: e.target.value } })
                    if (touched.email)
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: e.target.value && !EMAIL_RE.test(e.target.value) ? 'Некорректный email' : undefined,
                      }))
                  }}
                  onBlur={() => {
                    touch('email')
                    setFieldErrors((prev) => ({
                      ...prev,
                      email: form.email && !EMAIL_RE.test(form.email) ? 'Некорректный email' : undefined,
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
                onChange={(e) => dispatch({ type: 'patch', patch: { description: e.target.value } })}
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
                onChange={(e) => dispatch({ type: 'patch', patch: { workingHours: e.target.value } })}
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
                    Радиус: {formatRadius(form.serviceRadiusMeters)}
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
                dispatch({ type: 'patch', patch: { latitude: lat, longitude: lng, serviceRadiusMeters: radius } })
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
          {/* Avatar */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>
              <Camera className="w-4 h-4 text-muted-foreground" />
              Аватар
            </h2>
            <AvatarSection
              shopId={shopId}
              avatarUrl={form.avatarUrl}
              businessName={form.businessName}
              onUpdate={(url) => dispatch({ type: 'patch', patch: { avatarUrl: url } })}
            />
          </div>

          {/* Gallery */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>
              <Image className="w-4 h-4 text-muted-foreground" />
              Фотогалерея
              {form.photos.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({form.photos.length}/{MAX_PHOTOS})
                </span>
              )}
            </h2>
            {form.photos.length === 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                Перетащите фото сюда или нажмите «Добавить» · до 10 файлов за раз · JPEG, PNG,
                WEBP, GIF · до 10 МБ каждый
              </p>
            )}
            <PhotosSection
              shopId={shopId}
              photos={form.photos}
              onUpdate={(p) => dispatch({ type: 'patch', patch: { photos: p } })}
            />
          </div>

          {/* Courier delivery */}
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
                      onChange={(e) => dispatch({ type: 'patch', patch: { maxCourierMeters: e.target.value } })}
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
  )
}
