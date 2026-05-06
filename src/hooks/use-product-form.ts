import { useReducer, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductsService } from '@/api/catalog'
import type { ProductDto } from '@/api/catalog'
import {
  productFormReducer,
  INIT_PRODUCT_FORM,
  validateProductForm,
  type ProductFormState,
  type ProductFormAction,
  type ProductFieldErrors,
} from '@/lib/product-form'

export type { ProductFormState, ProductFormAction }

export function useProductForm(
  productId: string | undefined,
  product: ProductDto | null,
  setProduct: (p: ProductDto) => void,
) {
  const navigate = useNavigate()
  const isEdit = !!productId

  const [form, rawDispatch] = useReducer(productFormReducer, INIT_PRODUCT_FORM)
  const [isDirty, setIsDirty] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [stockDelta, setStockDelta] = useState('')
  const [stockSaving, setStockSaving] = useState(false)
  const [stockSaved, setStockSaved] = useState(false)
  const [stockError, setStockError] = useState<string | null>(null)

  useEffect(() => {
    if (!product) return
    rawDispatch({ type: 'init', product })
  }, [product])

  // Wrapped dispatch: marks form dirty on every patch from the page
  const dispatch = useCallback(
    (action: ProductFormAction) => {
      rawDispatch(action)
      if (action.type === 'patch') setIsDirty(true)
    },
    [rawDispatch],
  )

  const handleSubmit = async () => {
    if (saving) return
    const errs = validateProductForm(form, isEdit)
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)
    const price = parseFloat(form.price)
    const leadTimeDays = form.leadTimeDays ? parseInt(form.leadTimeDays, 10) : null
    try {
      if (isEdit && productId) {
        const updated = await ProductsService.putApiCatalogProducts({
          id: productId,
          requestBody: {
            categoryId: form.categoryId,
            name: form.name || null,
            description: form.description || null,
            price,
            unit: form.unit || null,
            isActive: form.isActive,
            isMadeToOrder: form.isMadeToOrder,
            leadTimeDays: form.isMadeToOrder ? leadTimeDays : null,
          },
        })
        setProduct(updated)
        setSaved(true)
        setIsDirty(false)
        setTimeout(() => setSaved(false), 2500)
      } else {
        const created = await ProductsService.postApiCatalogProducts({
          requestBody: {
            shopId: form.shopId,
            categoryId: form.categoryId,
            name: form.name || null,
            description: form.description || null,
            price,
            unit: form.unit || null,
            initialStock: form.isMadeToOrder ? 0 : parseInt(form.initialStock, 10),
            isMadeToOrder: form.isMadeToOrder,
            leadTimeDays: form.isMadeToOrder ? leadTimeDays : null,
            latitude: form.latitude,
            longitude: form.longitude,
          },
        })
        setIsDirty(false)
        navigate(`/seller/products/${created.id}/edit`, { replace: true })
      }
    } catch {
      setError('Не удалось сохранить товар')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjustStock = async (): Promise<boolean> => {
    if (!productId || stockSaving) return false
    const delta = parseInt(stockDelta, 10)
    if (isNaN(delta) || delta === 0) {
      setStockError(
        'Введите ненулевое целое число (положительное — добавить, отрицательное — списать)',
      )
      return false
    }
    setStockSaving(true)
    setStockError(null)
    try {
      await ProductsService.patchApiCatalogProductsStock({
        id: productId,
        requestBody: { quantityDelta: delta, changeType: 'ManualAdjustment' },
      })
      setStockDelta('')
      setStockSaved(true)
      setTimeout(() => setStockSaved(false), 2500)
      return true
    } catch {
      setStockError('Не удалось изменить остаток')
      return false
    } finally {
      setStockSaving(false)
    }
  }

  return {
    form,
    dispatch,
    isDirty,
    fieldErrors,
    setFieldErrors,
    saving,
    saved,
    error,
    stockDelta,
    setStockDelta,
    stockSaving,
    stockSaved,
    stockError,
    handleSubmit,
    handleAdjustStock,
    isEdit,
  }
}
