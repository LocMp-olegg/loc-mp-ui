import type { BusinessType, ShopDto, ShopPhotoDto } from '@/api/catalog'
import { EMAIL_RE, PHONE_RE } from '@/lib/auth-validation'

export const INN_RE = /^(\d{10}|\d{12})$/

export const BUSINESS_OPTIONS = [
  { value: '', label: 'Не указан' },
  { value: 'Individual', label: 'Частное лицо' },
  { value: 'SoleProprietor', label: 'ИП' },
  { value: 'SmallBusiness', label: 'ООО / компания' },
]

export type FormState = {
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

export const INIT_FORM: FormState = {
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

export type FormAction =
  | { type: 'init'; shop: ShopDto }
  | { type: 'patch'; patch: Partial<FormState> }

const VALID_BUSINESS_TYPES = ['Individual', 'SoleProprietor', 'SmallBusiness']

export function formReducer(state: FormState, action: FormAction): FormState {
  if (action.type === 'init') {
    const rawPhone = (action.shop.phoneNumber ?? '').replace(/\D/g, '')
    return {
      businessName: action.shop.businessName ?? '',
      businessType: VALID_BUSINESS_TYPES.includes(action.shop.businessType as string)
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

export type FieldErrors = {
  businessName?: string
  phoneNumber?: string
  email?: string
  inn?: string
}

export type TouchedFields = Partial<Record<keyof FieldErrors, boolean>>

export function validateFields(name: string, phone: string, mail: string, inn: string): FieldErrors {
  const e: FieldErrors = {}
  if (!name.trim()) e.businessName = 'Обязательное поле'
  else if (name.length > 200) e.businessName = 'Максимум 200 символов'
  if (phone && !PHONE_RE.test(phone)) e.phoneNumber = 'Введите все 10 цифр номера'
  if (mail && !EMAIL_RE.test(mail)) e.email = 'Некорректный email'
  if (inn && !INN_RE.test(inn)) e.inn = 'ИНН — 10 (юрлицо) или 12 (физлицо) цифр'
  return e
}
