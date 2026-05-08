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
  _ready: boolean
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
  addressCity: string
  addressStreet: string
  addressHouseNumber: string
  addressApartment: string
  addressEntrance: string
  addressFloor: string
  allowCourier: boolean
  maxCourierMeters: string
  avatarUrl: string | null
  photos: ShopPhotoDto[]
}

export const INIT_FORM: FormState = {
  _ready: false,
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
  addressCity: '',
  addressStreet: '',
  addressHouseNumber: '',
  addressApartment: '',
  addressEntrance: '',
  addressFloor: '',
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
      _ready: true,
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
      addressCity: action.shop.address?.city ?? '',
      addressStreet: action.shop.address?.street ?? '',
      addressHouseNumber: action.shop.address?.houseNumber ?? '',
      addressApartment: action.shop.address?.apartment ?? '',
      addressEntrance: action.shop.address?.entrance ?? '',
      addressFloor: action.shop.address?.floor ?? '',
      allowCourier: action.shop.allowCourierDelivery ?? false,
      maxCourierMeters: action.shop.maxCourierDistanceMeters?.toString() ?? '',
      avatarUrl: action.shop.avatarUrl ?? state.avatarUrl,
      photos: action.shop.photos?.length ? action.shop.photos : state.photos,
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

export function validateFields(
  name: string,
  phone: string,
  mail: string,
  inn: string,
): FieldErrors {
  const e: FieldErrors = {}
  if (!name.trim()) e.businessName = 'Обязательное поле'
  else if (name.length > 200) e.businessName = 'Максимум 200 символов'
  if (!phone) e.phoneNumber = 'Обязательное поле'
  else if (!PHONE_RE.test(phone)) e.phoneNumber = 'Введите все 10 цифр номера'
  if (!mail) e.email = 'Обязательное поле'
  else if (!EMAIL_RE.test(mail)) e.email = 'Некорректный email'
  if (inn && !INN_RE.test(inn)) e.inn = 'ИНН — 10 (юрлицо) или 12 (физлицо) цифр'
  return e
}
