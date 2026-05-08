import React, { useState, useReducer, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  Store,
  Truck,
  MessageSquare,
  ShoppingBag,
  MapPin,
  Plus,
  Star,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CartsService, ApiError } from '@/api/orders'
import { useAddresses } from '@/contexts/addresses-context'
import { useProfile } from '@/hooks/use-profile'
import { AddressFormModal } from '@/components/profile/address-form-modal'
import { pluralize } from '@/lib/utils'
import { formatPhone, PHONE_RE } from '@/lib/auth-validation'
import type { CartItemDto, DeliveryAddressRequest } from '@/api/orders'
import type { ProductDto } from '@/api/catalog'
import type { UserAddressDto, CreateUserAddressRequest } from '@/api/identity'

export interface CheckoutGroup {
  sellerId: string
  shopId?: string | null
  shopName?: string | null
  sellerName?: string | null
  items: CartItemDto[]
  isFullGroup: boolean
}

const RECIPIENT_NAME_MAX = 200

interface GroupForm {
  deliveryType: 'Pickup' | 'NeighborCourier'
  selectedAddressId: string | null
  recipientName: string
  recipientPhoneDigits: string
}

interface GroupErrors {
  address?: string
  recipientName?: string
  recipientPhone?: string
}

function defaultGroupForm(defaultAddr: UserAddressDto | undefined): GroupForm {
  return {
    deliveryType: 'Pickup',
    selectedAddressId: defaultAddr?.id ?? null,
    recipientName: '',
    recipientPhoneDigits: '',
  }
}

function digitsFromRaw(raw: string | null | undefined): string {
  if (!raw) return ''
  const all = raw.replace(/\D/g, '')
  return (all.startsWith('7') ? all.slice(1) : all).slice(0, 10)
}

function validateGroupForm(form: GroupForm): GroupErrors {
  if (form.deliveryType !== 'NeighborCourier') return {}
  const errs: GroupErrors = {}
  if (!form.selectedAddressId) errs.address = 'Выберите адрес доставки'
  if (!form.recipientName.trim()) errs.recipientName = 'Укажите получателя'
  else if (form.recipientName.length > RECIPIENT_NAME_MAX)
    errs.recipientName = `Максимум ${RECIPIENT_NAME_MAX} символов`
  if (!form.recipientPhoneDigits) errs.recipientPhone = 'Укажите телефон получателя'
  else if (!PHONE_RE.test(form.recipientPhoneDigits)) errs.recipientPhone = 'Введите все 10 цифр'
  return errs
}

// ── groupForms reducer (avoids setState-in-effect) ────────────────────────────

type FormsAction =
  | { type: 'update'; idx: number; patch: Partial<GroupForm> }
  | { type: 'initAddress'; id: string }
  | { type: 'initProfile'; name: string; digits: string }

function formsReducer(state: GroupForm[], action: FormsAction): GroupForm[] {
  switch (action.type) {
    case 'update':
      return state.map((f, i) => (i === action.idx ? { ...f, ...action.patch } : f))
    case 'initAddress':
      return state.map((f) => (f.selectedAddressId ? f : { ...f, selectedAddressId: action.id }))
    case 'initProfile':
      return state.map((f) => ({
        ...f,
        recipientName: f.recipientName || action.name,
        recipientPhoneDigits: f.recipientPhoneDigits || action.digits,
      }))
  }
}

const DELIVERY_RANGE_RE =
  /Delivery address is ([\d.]+) km away\. Shop '([0-9a-f-]+)' only delivers within ([\d.]+) km/i

interface DeliveryRangeError {
  shopId: string
  distanceKm: number
  radiusKm: number
}

function parseDeliveryRangeError(detail: string): DeliveryRangeError | null {
  const m = DELIVERY_RANGE_RE.exec(detail)
  if (!m) return null
  return { distanceKm: parseFloat(m[1]), shopId: m[2], radiusKm: parseFloat(m[3]) }
}

const SHOP_INACTIVE_RE = /The shop for product '(.+?)' is temporarily inactive/i

function parseShopInactiveError(detail: string): string | null {
  const m = SHOP_INACTIVE_RE.exec(detail)
  if (!m) return null
  return `Магазин для товара «${m[1]}» временно не работает. Удалите товар из корзины или попробуйте позже.`
}

function addressToDelivery(
  addr: UserAddressDto,
  recipientName: string,
  recipientPhoneDigits: string,
): DeliveryAddressRequest {
  return {
    city: addr.city ?? undefined,
    street: addr.street ?? undefined,
    houseNumber: addr.houseNumber ?? undefined,
    apartment: addr.apartment ?? undefined,
    entrance: addr.entrance ?? undefined,
    floor: addr.floor ? Number(addr.floor) : undefined,
    latitude: addr.latitude ?? undefined,
    longitude: addr.longitude ?? undefined,
    recipientName: recipientName.trim(),
    recipientPhone: recipientPhoneDigits ? `+7${recipientPhoneDigits}` : '',
  }
}

function formatAddressShort(addr: UserAddressDto): string {
  const parts = [addr.street, addr.houseNumber].filter(Boolean).join(', ')
  const apt = addr.apartment ? `кв. ${addr.apartment}` : ''
  return [parts, apt].filter(Boolean).join(', ') || addr.city || ''
}

export interface CheckoutModalProps {
  groups: CheckoutGroup[]
  productInfoMap: Record<string, ProductDto>
  onClose: () => void
  onSuccess: () => void
}

export function CheckoutModal({ groups, productInfoMap, onClose, onSuccess }: CheckoutModalProps) {
  const navigate = useNavigate()
  const { addresses, loading: addrLoading, createAddress } = useAddresses()
  const { profile } = useProfile()

  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0]

  const [groupForms, dispatchForms] = useReducer(formsReducer, groups, (gs) =>
    gs.map(() => defaultGroupForm(defaultAddr)),
  )
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingForIdx, setAddingForIdx] = useState<number | null>(null)

  useEffect(() => {
    if (addrLoading || addresses.length === 0) return
    const newDefault = addresses.find((a) => a.isDefault) ?? addresses[0]
    if (newDefault?.id) dispatchForms({ type: 'initAddress', id: newDefault.id })
  }, [addrLoading, addresses])

  useEffect(() => {
    if (!profile) return
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    const digits = digitsFromRaw(profile.phoneNumber)
    dispatchForms({ type: 'initProfile', name: fullName, digits })
  }, [profile])

  const updateGroupForm = useCallback((idx: number, patch: Partial<GroupForm>) => {
    dispatchForms({ type: 'update', idx, patch })
  }, [])

  const handleAddAddress = useCallback(
    async (data: CreateUserAddressRequest) => {
      const created = await createAddress(data)
      if (addingForIdx !== null) {
        updateGroupForm(addingForIdx, { selectedAddressId: created.id ?? null })
      }
      setAddingForIdx(null)
    },
    [addingForIdx, createAddress, updateGroupForm],
  )

  const [groupErrors, setGroupErrors] = useState<GroupErrors[]>(() => groups.map(() => ({})))
  const [groupDeliveryErrors, setGroupDeliveryErrors] = useState<(string | null)[]>(() =>
    groups.map(() => null),
  )

  const handleSubmit = async () => {
    const newErrors = groupForms.map(validateGroupForm)
    setGroupErrors(newErrors)
    setGroupDeliveryErrors(groups.map(() => null))
    if (newErrors.some((e) => Object.keys(e).length > 0)) return

    setBusy(true)
    setError(null)
    try {
      await CartsService.postApiOrdersCartsCheckout({
        requestBody: {
          buyerComment: comment || undefined,
          groups: groups.map((g, i) => {
            const form = groupForms[i]
            const addr = addresses.find((a) => a.id === form.selectedAddressId)
            return {
              sellerId: g.sellerId,
              shopId: g.shopId ?? undefined,
              deliveryType: form.deliveryType,
              deliveryAddress:
                form.deliveryType === 'NeighborCourier' && addr
                  ? addressToDelivery(addr, form.recipientName, form.recipientPhoneDigits)
                  : undefined,
              selectedItemIds: g.isFullGroup ? undefined : g.items.map((item) => item.id!),
            }
          }),
        },
      })
      onSuccess()
      navigate('/orders')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const detail: string = e.body?.detail ?? ''
        const rangeErr = parseDeliveryRangeError(detail)
        if (rangeErr) {
          const idx = groups.findIndex((g) => g.shopId === rangeErr.shopId)
          if (idx !== -1) {
            setGroupDeliveryErrors((prev) => {
              const next = [...prev]
              next[idx] =
                `Адрес слишком далеко (${rangeErr.distanceKm} км). ` +
                `Магазин доставляет только в радиусе ${rangeErr.radiusKm} км — выберите другой адрес или самовывоз.`
              return next
            })
            setBusy(false)
            return
          }
        }
        const inactiveMsg = parseShopInactiveError(detail)
        if (inactiveMsg) {
          setError(inactiveMsg)
        } else {
          setError(detail || 'Не удалось оформить заказ — конфликт условий.')
        }
      } else {
        setError('Не удалось оформить заказ. Попробуйте ещё раз.')
      }
      setBusy(false)
    }
  }

  const totalAmount = groups.reduce(
    (sum, g) => sum + g.items.reduce((s, item) => s + (item.subtotal ?? 0), 0),
    0,
  )

  const modal = (
    <motion.div
      key="checkout-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        key="checkout-panel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Оформление заказа</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {groups.map((group, idx) => (
            <GroupSection
              key={group.sellerId + (group.shopId ?? '')}
              group={group}
              form={groupForms[idx]}
              errors={groupErrors[idx]}
              deliveryError={groupDeliveryErrors[idx]}
              productInfoMap={productInfoMap}
              addresses={addresses}
              addrLoading={addrLoading}
              onChange={(patch) => {
                updateGroupForm(idx, patch)
                if ('selectedAddressId' in patch || 'deliveryType' in patch) {
                  setGroupDeliveryErrors((prev) => {
                    const next = [...prev]
                    next[idx] = null
                    return next
                  })
                }
              }}
              onAddAddress={() => setAddingForIdx(idx)}
              showHeader={groups.length > 1}
            />
          ))}

          {/* Comment */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Комментарий (необязательно)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Пожелания к заказу..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 resize-none"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Итого</p>
            <p className="text-base font-bold text-foreground">
              {totalAmount.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Заказать
          </button>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <>
      {createPortal(modal, document.body)}
      <AnimatePresence>
        {addingForIdx !== null && (
          <AddressFormModal onClose={() => setAddingForIdx(null)} onSave={handleAddAddress} />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Group section ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full h-9 px-3 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors'
const inputOk = 'border-border focus:border-primary/50'
const inputErr = 'border-destructive/60 focus:border-destructive'

interface GroupSectionProps {
  group: CheckoutGroup
  form: GroupForm
  errors: GroupErrors
  deliveryError: string | null
  productInfoMap: Record<string, ProductDto>
  addresses: UserAddressDto[]
  addrLoading: boolean
  onChange: (patch: Partial<GroupForm>) => void
  onAddAddress: () => void
  showHeader: boolean
}

function GroupSection({
  group,
  form,
  errors,
  deliveryError,
  productInfoMap,
  addresses,
  addrLoading,
  onChange,
  onAddAddress,
  showHeader,
}: GroupSectionProps) {
  const shopLabel = group.shopName ?? group.sellerName ?? 'Магазин'
  const n = group.items.length

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {showHeader && (
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-muted/30">
          <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{shopLabel}</span>
          <span className="ml-auto text-xs text-muted-foreground shrink-0">
            {n} {pluralize(n, 'товар', 'товара', 'товаров')}
          </span>
        </div>
      )}

      <div className="px-3 py-3 space-y-3">
        {/* Items preview */}
        <div className="space-y-1">
          {group.items.slice(0, 3).map((item) => {
            const info = item.productId ? productInfoMap[item.productId] : undefined
            return (
              <div key={item.id} className="flex items-center gap-2">
                {info?.mainPhotoUrl && (
                  <img
                    src={info.mainPhotoUrl}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover bg-muted shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground truncate">{item.productName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.quantity} × {(item.price ?? 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <span className="text-xs font-medium text-foreground shrink-0">
                  {(item.subtotal ?? 0).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )
          })}
          {n > 3 && (
            <p className="text-xs text-muted-foreground pl-10">
              +{n - 3} {pluralize(n - 3, 'товар', 'товара', 'товаров')}
            </p>
          )}
        </div>

        {/* Delivery type */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Способ получения</p>
          <div className="flex gap-2">
            <DeliveryTypeBtn
              active={form.deliveryType === 'Pickup'}
              icon={<Store className="w-3.5 h-3.5" />}
              label="Самовывоз"
              onClick={() => onChange({ deliveryType: 'Pickup' })}
            />
            <DeliveryTypeBtn
              active={form.deliveryType === 'NeighborCourier'}
              icon={<Truck className="w-3.5 h-3.5" />}
              label="Курьер-сосед"
              onClick={() => onChange({ deliveryType: 'NeighborCourier' })}
            />
          </div>
        </div>

        {/* Address picker + recipient */}
        <AnimatePresence>
          {form.deliveryType === 'NeighborCourier' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <AddressPicker
                  addresses={addresses}
                  loading={addrLoading}
                  selectedId={form.selectedAddressId}
                  onSelect={(id) => onChange({ selectedAddressId: id })}
                  onAddNew={onAddAddress}
                  error={errors.address}
                />

                <AnimatePresence>
                  {deliveryError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/8 border border-destructive/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive leading-relaxed">{deliveryError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recipient fields */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Получатель</p>
                  <div>
                    <input
                      className={`${inputCls} ${errors.recipientName ? inputErr : inputOk}`}
                      placeholder="Имя получателя *"
                      value={form.recipientName}
                      maxLength={RECIPIENT_NAME_MAX}
                      onChange={(e) => onChange({ recipientName: e.target.value })}
                    />
                    {errors.recipientName && (
                      <p className="text-xs text-destructive mt-1">{errors.recipientName}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="tel"
                      className={`${inputCls} ${errors.recipientPhone ? inputErr : inputOk}`}
                      placeholder="+7 (999) 000-00-00 *"
                      value={formatPhone(form.recipientPhoneDigits)}
                      onChange={(e) => {
                        const all = e.target.value.replace(/\D/g, '')
                        const digits = (all.startsWith('7') ? all.slice(1) : all).slice(0, 10)
                        onChange({ recipientPhoneDigits: digits })
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          e.preventDefault()
                          onChange({ recipientPhoneDigits: form.recipientPhoneDigits.slice(0, -1) })
                        }
                      }}
                    />
                    {errors.recipientPhone && (
                      <p className="text-xs text-destructive mt-1">{errors.recipientPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Delivery type button ───────────────────────────────────────────────────────

function DeliveryTypeBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Address picker ────────────────────────────────────────────────────────────

function AddressPicker({
  addresses,
  loading,
  selectedId,
  onSelect,
  onAddNew,
  error,
}: {
  addresses: UserAddressDto[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onAddNew: () => void
  error?: string
}) {
  if (loading) {
    return (
      <div className="pt-1 space-y-1.5">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="pt-1 space-y-1.5">
      <p
        className={`text-xs font-medium flex items-center gap-1 mb-1 ${error ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        <MapPin className="w-3.5 h-3.5" />
        Адрес доставки
        {error && <span className="font-normal">— {error}</span>}
      </p>

      {addresses.length === 0 ? (
        <p className="text-xs text-muted-foreground">Нет сохранённых адресов</p>
      ) : (
        <div className="space-y-1">
          {addresses.map((addr) => {
            const selected = addr.id === selectedId
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelect(addr.id!)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  selected
                    ? 'border-primary bg-primary/8'
                    : 'border-border hover:border-border/70 hover:bg-muted/40'
                }`}
              >
                {/* Radio dot */}
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    selected ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium text-foreground">
                      {addr.title || 'Адрес'}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-primary">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Основной
                      </span>
                    )}
                  </div>
                  {formatAddressShort(addr) && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {formatAddressShort(addr)}
                    </p>
                  )}
                  {addr.city && <p className="text-[10px] text-muted-foreground/60">{addr.city}</p>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onAddNew}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Добавить новый адрес
      </button>
    </div>
  )
}
