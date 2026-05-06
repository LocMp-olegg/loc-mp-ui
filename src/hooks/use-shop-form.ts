import { useReducer, useState, useEffect, useCallback } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShopsService } from '@/api/catalog'
import type { BusinessType, ShopDto } from '@/api/catalog'
import { reverseGeocode } from '@/lib/geo'
import { formatPhone, EMAIL_RE, PHONE_RE } from '@/lib/auth-validation'
import {
  formReducer,
  INIT_FORM,
  INN_RE,
  validateFields,
  type FormState,
  type FormAction,
  type FieldErrors,
  type TouchedFields,
} from '@/lib/shop-form'

export type { FormState, FormAction }

export function useShopForm(
  shopId: string | undefined,
  shop: ShopDto | null,
  setShop: (s: ShopDto) => void,
) {
  const navigate = useNavigate()
  const isEdit = !!shopId

  const [form, rawDispatch] = useReducer(formReducer, INIT_FORM)
  const [isDirty, setIsDirty] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({})
  const touch = (f: keyof FieldErrors) => setTouched((t) => ({ ...t, [f]: true }))

  const [locationLabel, setLocationLabel] = useState('')
  const [locationModalOpen, setLocationModalOpen] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [courierSaved, setCourierSaved] = useState(false)
  const [courierSaving, setCourierSaving] = useState(false)
  const [courierError, setCourierError] = useState<string | null>(null)

  useEffect(() => {
    if (!shop) return
    rawDispatch({ type: 'init', shop })
    if (shop.latitude && shop.longitude) {
      reverseGeocode(shop.latitude, shop.longitude).then(setLocationLabel)
    }
  }, [shop])

  // Wrapped dispatch: marks form dirty on every patch from the page
  const dispatch = useCallback(
    (action: FormAction) => {
      rawDispatch(action)
      if (action.type === 'patch') setIsDirty(true)
    },
    [rawDispatch],
  )

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const allDigits = e.target.value.replace(/\D/g, '')
    const digits = allDigits.startsWith('7') ? allDigits.slice(1) : allDigits
    const next = digits.slice(0, 10)
    rawDispatch({ type: 'patch', patch: { phoneNumber: next } })
    setIsDirty(true)
    if (touched.phoneNumber)
      setFieldErrors((prev) => ({
        ...prev,
        phoneNumber: next && !PHONE_RE.test(next) ? 'Введите все 10 цифр номера' : undefined,
      }))
  }

  const handlePhoneKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      rawDispatch({ type: 'patch', patch: { phoneNumber: form.phoneNumber.slice(0, -1) } })
      setIsDirty(true)
    }
  }

  const handleInnChange = (e: ChangeEvent<HTMLInputElement>) => {
    rawDispatch({ type: 'patch', patch: { inn: e.target.value } })
    setIsDirty(true)
    if (touched.inn)
      setFieldErrors((prev) => ({
        ...prev,
        inn:
          e.target.value && !INN_RE.test(e.target.value)
            ? 'ИНН — 10 (юрлицо) или 12 (физлицо) цифр'
            : undefined,
      }))
  }

  const handleInnBlur = () => {
    touch('inn')
    setFieldErrors((prev) => ({
      ...prev,
      inn:
        form.inn && !INN_RE.test(form.inn) ? 'ИНН — 10 (юрлицо) или 12 (физлицо) цифр' : undefined,
    }))
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    rawDispatch({ type: 'patch', patch: { email: e.target.value } })
    setIsDirty(true)
    if (touched.email)
      setFieldErrors((prev) => ({
        ...prev,
        email: e.target.value && !EMAIL_RE.test(e.target.value) ? 'Некорректный email' : undefined,
      }))
  }

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
        setSaved(true)
        setIsDirty(false)
        setTimeout(() => setSaved(false), 2500)
      } else {
        const created = await ShopsService.postApiCatalogShops({ requestBody: payload })
        setIsDirty(false)
        navigate(`/seller/shops/${created.id}/edit`, { replace: true })
        return
      }
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
          maxDistanceMeters:
            form.allowCourier && form.maxCourierMeters ? Number(form.maxCourierMeters) : null,
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

  return {
    form,
    dispatch,
    isDirty,
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
  }
}
