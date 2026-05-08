import type { ProductDto } from '@/api/catalog'

export type ProductFormState = {
  shopId: string
  categoryId: string
  name: string
  description: string
  price: string
  unit: string
  isActive: boolean
  isMadeToOrder: boolean
  leadTimeDays: string
  initialStock: string
  latitude: number | null
  longitude: number | null
}

export const INIT_PRODUCT_FORM: ProductFormState = {
  shopId: '',
  categoryId: '',
  name: '',
  description: '',
  price: '',
  unit: 'шт',
  isActive: true,
  isMadeToOrder: false,
  leadTimeDays: '',
  initialStock: '0',
  latitude: null,
  longitude: null,
}

export type ProductFormAction =
  | { type: 'init'; product: ProductDto }
  | { type: 'patch'; patch: Partial<ProductFormState> }
  | { type: 'reset' }

export function productFormReducer(
  state: ProductFormState,
  action: ProductFormAction,
): ProductFormState {
  if (action.type === 'reset') return { ...INIT_PRODUCT_FORM }
  if (action.type === 'init') {
    return {
      shopId: action.product.shopId ?? '',
      categoryId: action.product.categoryId ?? '',
      name: action.product.name ?? '',
      description: action.product.description ?? '',
      price: String(action.product.price ?? ''),
      unit: action.product.unit ?? 'шт',
      isActive: action.product.isActive ?? true,
      isMadeToOrder: action.product.isMadeToOrder ?? false,
      leadTimeDays: action.product.leadTimeDays != null ? String(action.product.leadTimeDays) : '',
      initialStock: String(action.product.stockQuantity ?? 0),
      latitude: action.product.latitude ?? null,
      longitude: action.product.longitude ?? null,
    }
  }
  return { ...state, ...action.patch }
}

export type ProductFieldErrors = {
  shopId?: string
  categoryId?: string
  name?: string
  description?: string
  price?: string
  unit?: string
  initialStock?: string
  leadTimeDays?: string
}

export function validateProductForm(form: ProductFormState, isEdit: boolean): ProductFieldErrors {
  const e: ProductFieldErrors = {}
  if (!isEdit && !form.shopId) e.shopId = 'Выберите магазин'
  if (!form.categoryId) e.categoryId = 'Выберите категорию'
  if (!form.name.trim()) e.name = 'Обязательное поле'
  else if (form.name.length > 200) e.name = 'Максимум 200 символов'
  if (form.description.length > 4000) e.description = 'Максимум 4000 символов'
  const price = parseFloat(form.price)
  if (!form.price || isNaN(price) || price <= 0) e.price = 'Цена должна быть больше 0'
  if (!form.unit.trim()) e.unit = 'Обязательное поле'
  else if (form.unit.length > 20) e.unit = 'Максимум 20 символов'
  if (!isEdit && !form.isMadeToOrder) {
    const stock = parseInt(form.initialStock, 10)
    if (form.initialStock === '' || isNaN(stock) || stock < 0)
      e.initialStock = 'Введите остаток ≥ 0'
  }
  if (form.isMadeToOrder && form.leadTimeDays) {
    const days = parseInt(form.leadTimeDays, 10)
    if (isNaN(days) || days < 1) e.leadTimeDays = 'Введите количество дней ≥ 1'
  }
  return e
}
