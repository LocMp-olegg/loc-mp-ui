import { useState, useEffect, useReducer } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  Package,
  MapPin,
  Phone,
  Clock,
  Truck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  PackageCheck,
} from 'lucide-react'
import { useOrderDetail } from '@/hooks/use-order-detail'
import { ShopsService } from '@/api/catalog'
import { OrderStatusBadge } from '@/components/seller/orders/order-status-badge'
import { OrderItemsSection } from '@/components/orders/order-items-section'
import { shortOrderId, formatDateTime, displayPhone } from '@/lib/format'
import { CourierDeliveryMap } from './courier-delivery-map'
import type { ShopDto } from '@/api/catalog'

export interface CourierOrderModalProps {
  orderId: string | null
  onClose: () => void
  courierLat?: number | null
  courierLng?: number | null
  /** Available orders: show apply button */
  applied?: boolean
  onApply?: (orderId: string) => Promise<void>
  /** Pending applications: show withdraw button */
  applicationId?: string | null
  onWithdraw?: (applicationId: string) => Promise<void>
  /** Active deliveries: pickup / deliver actions */
  onPickup?: (orderId: string) => Promise<void>
  onDeliver?: (orderId: string) => Promise<void>
}

export function CourierOrderModal({
  orderId,
  onClose,
  courierLat,
  courierLng,
  applied,
  onApply,
  applicationId,
  onWithdraw,
  onPickup,
  onDeliver,
}: CourierOrderModalProps) {
  const { order, loading, error } = useOrderDetail(orderId)
  const [shop, dispatchShop] = useReducer((_: ShopDto | null, s: ShopDto | null) => s, null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!order?.shopId) {
      dispatchShop(null)
      return
    }
    ShopsService.getApiCatalogShops({ id: order.shopId })
      .then(dispatchShop)
      .catch(() => {})
  }, [order?.shopId])

  const handleApply = async () => {
    if (!orderId || !onApply) return
    setActionBusy(true)
    setActionError(null)
    try {
      await onApply(orderId)
    } catch {
      setActionError('Не удалось подать заявку')
    } finally {
      setActionBusy(false)
    }
  }

  const handleWithdraw = async () => {
    if (!applicationId || !onWithdraw) return
    setActionBusy(true)
    setActionError(null)
    try {
      await onWithdraw(applicationId)
      onClose()
    } catch {
      setActionError('Не удалось отозвать заявку')
    } finally {
      setActionBusy(false)
    }
  }

  const isReadyForCourier = order?.status === 'ReadyForCourier'
  const isInDelivery = order?.status === 'InDelivery'
  const isConfirmedDelivery =
    order?.status === 'Confirmed' && (onPickup != null || onDeliver != null)

  const hasFooter =
    !loading &&
    !error &&
    (onApply != null ||
      (applicationId && onWithdraw) ||
      isReadyForCourier ||
      isInDelivery ||
      isConfirmedDelivery)

  const modal = (
    <AnimatePresence>
      {orderId && (
        <motion.div
          key="courier-order-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            key="courier-order-panel"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.2 }}
            className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Заказ #{shortOrderId(order?.id ?? orderId)}
                </h2>
                {order?.status && <OrderStatusBadge status={order.status} />}
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
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : error ? (
                <p className="text-sm text-destructive text-center py-8">{error}</p>
              ) : order ? (
                <>
                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(order.createdAt)}
                    </span>
                    {order.shopName && order.shopId && (
                      <Link
                        to={`/shop/${order.shopId}`}
                        onClick={onClose}
                        className="flex items-center gap-1 text-primary hover:underline truncate"
                      >
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        {order.shopName}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </Link>
                    )}
                    <span className="flex items-center gap-1 ml-auto shrink-0">
                      <Truck className="w-3.5 h-3.5" /> Курьер
                    </span>
                  </div>

                  {/* Items */}
                  <OrderItemsSection order={order} />

                  {/* Shop address */}
                  {shop?.address && (
                    <section>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Адрес магазина (забрать)
                      </p>
                      <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5">
                        <p className="flex items-start gap-1.5 text-sm text-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                          <span>
                            {[
                              shop.address.city,
                              shop.address.street,
                              shop.address.houseNumber,
                              shop.address.apartment && `кв. ${shop.address.apartment}`,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Delivery address */}
                  {order.deliveryAddress && (
                    <section>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Адрес доставки
                      </p>
                      <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 space-y-1">
                        <p className="flex items-start gap-1.5 text-sm text-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                          <span>
                            {[
                              order.deliveryAddress.city,
                              order.deliveryAddress.street,
                              order.deliveryAddress.houseNumber,
                              order.deliveryAddress.apartment &&
                                `кв. ${order.deliveryAddress.apartment}`,
                              order.deliveryAddress.entrance &&
                                `подъезд ${order.deliveryAddress.entrance}`,
                              order.deliveryAddress.floor && `этаж ${order.deliveryAddress.floor}`,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </p>
                        {order.deliveryAddress.recipientName && (
                          <p className="text-xs text-muted-foreground pl-5">
                            {order.deliveryAddress.recipientName}
                          </p>
                        )}
                        {order.deliveryAddress.recipientPhone && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground pl-5">
                            <Phone className="w-3 h-3 shrink-0" />
                            {displayPhone(order.deliveryAddress.recipientPhone)}
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Map */}
                  {(shop?.latitude != null || order.deliveryAddress?.latitude != null) && (
                    <section>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Маршрут
                      </p>
                      <CourierDeliveryMap
                        shopLat={shop?.latitude}
                        shopLng={shop?.longitude}
                        shopName={order.shopName}
                        deliveryLat={order.deliveryAddress?.latitude}
                        deliveryLng={order.deliveryAddress?.longitude}
                        deliveryAddress={[
                          order.deliveryAddress?.street,
                          order.deliveryAddress?.houseNumber,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        recipientName={order.deliveryAddress?.recipientName}
                        courierLat={courierLat}
                        courierLng={courierLng}
                      />
                    </section>
                  )}

                  {/* Buyer comment */}
                  {order.buyerComment && (
                    <section>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Комментарий покупателя
                      </p>
                      <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-sm text-foreground">
                        {order.buyerComment}
                      </div>
                    </section>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            {hasFooter && (
              <div className="px-5 pb-4 pt-3 border-t border-border shrink-0 space-y-1">
                {actionError && (
                  <p className="text-xs text-destructive text-center">{actionError}</p>
                )}

                {/* Apply button */}
                {onApply && (
                  <button
                    type="button"
                    onClick={() => void handleApply()}
                    disabled={actionBusy || applied}
                    className={`w-full h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 ${
                      applied
                        ? 'bg-primary/10 text-primary'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {actionBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : applied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Заявка подана
                      </>
                    ) : (
                      'Откликнуться'
                    )}
                  </button>
                )}

                {/* Withdraw button */}
                {applicationId && onWithdraw && (
                  <button
                    type="button"
                    onClick={() => void handleWithdraw()}
                    disabled={actionBusy}
                    className="w-full h-10 rounded-xl border border-destructive/30 text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/8 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Отозвать заявку
                      </>
                    )}
                  </button>
                )}

                {/* Waiting for seller info */}
                {isConfirmedDelivery && (
                  <p className="text-sm text-muted-foreground text-center py-1">
                    Ожидает готовности продавца
                  </p>
                )}

                {/* Pickup button */}
                {isReadyForCourier && onPickup && (
                  <button
                    type="button"
                    onClick={() =>
                      void (async () => {
                        setActionBusy(true)
                        setActionError(null)
                        try {
                          await onPickup(orderId!)
                          onClose()
                        } catch {
                          setActionError('Не удалось подтвердить получение')
                        } finally {
                          setActionBusy(false)
                        }
                      })()
                    }
                    disabled={actionBusy}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <PackageCheck className="w-4 h-4" />
                        Забрал у продавца
                      </>
                    )}
                  </button>
                )}

                {/* Deliver button */}
                {isInDelivery && onDeliver && (
                  <button
                    type="button"
                    onClick={() =>
                      void (async () => {
                        setActionBusy(true)
                        setActionError(null)
                        try {
                          await onDeliver(orderId!)
                          onClose()
                        } catch {
                          setActionError('Не удалось подтвердить доставку')
                        } finally {
                          setActionBusy(false)
                        }
                      })()
                    }
                    disabled={actionBusy}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Доставил
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
