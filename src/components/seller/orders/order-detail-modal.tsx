import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { formatDateTime, shortOrderId, timeAgo, displayPhone } from '@/lib/format'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  Package,
  MapPin,
  Truck,
  Store,
  Clock,
  MessageSquare,
  Camera,
  Phone,
  CheckCircle2,
  XCircle,
  Users,
  Star,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrderStatusBadge } from './order-status-badge'
import { OrderPhotosSection } from './order-photos-section'
import { DisputeBlock } from '@/components/orders/dispute-block'
import { StatusHistory } from '@/components/orders/status-history'
import { useOrderDetail } from '@/hooks/use-order-detail'
import { useShopById } from '@/hooks/use-my-shops'
import { OrderItemsSection } from '@/components/orders/order-items-section'
import { useCourierRating } from '@/hooks/use-courier-rating'
import type { CourierApplicationDto } from '@/api/orders'

interface CourierApplicationRowProps {
  app: CourierApplicationDto
  busy: boolean
  onApprove: (id: string) => Promise<boolean>
  onReject: (id: string) => Promise<boolean>
}

function CourierApplicationRow({ app, busy, onApprove, onReject }: CourierApplicationRowProps) {
  const [localBusy, setLocalBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const courierRating = useCourierRating(app.courierId)

  const handle = async (fn: () => Promise<boolean>, errMsg: string) => {
    setLocalBusy(true)
    setLocalError(null)
    try {
      const ok = await fn()
      if (!ok) setLocalError(errMsg)
    } catch {
      setLocalError(errMsg)
    } finally {
      setLocalBusy(false)
    }
  }

  const isBusy = busy || localBusy

  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <Link
            to={`/couriers/${app.courierId}`}
            state={{ name: app.courierName, phone: app.courierPhone }}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
          >
            {app.courierName ?? 'Курьер'}
          </Link>
          {app.courierPhone && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              {displayPhone(app.courierPhone)}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {courierRating && (courierRating.reviewCount ?? 0) > 0 && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                {courierRating.averageRating?.toFixed(1)}
                <span className="text-muted-foreground/60">({courierRating.reviewCount})</span>
              </p>
            )}
            {app.distanceToShopMeters != null && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                {app.distanceToShopMeters < 1000
                  ? `${Math.round(app.distanceToShopMeters)} м от магазина`
                  : `${(app.distanceToShopMeters / 1000).toFixed(1)} км от магазина`}
              </p>
            )}
            {app.appliedAt && (
              <p className="text-[10px] text-muted-foreground">{timeAgo(app.appliedAt)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handle(() => onApprove(app.id ?? ''), 'Не удалось принять')}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {localBusy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Принять
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handle(() => onReject(app.id ?? ''), 'Не удалось отклонить')}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" />
            Отклонить
          </button>
        </div>
      </div>
      {localError && <p className="text-xs text-destructive">{localError}</p>}
    </div>
  )
}

interface CancelFormProps {
  busy: boolean
  onCancel: (comment?: string) => Promise<boolean>
}

function CancelForm({ busy, onCancel }: CancelFormProps) {
  const [confirming, setConfirming] = useState(false)
  const [comment, setComment] = useState('')

  const handleSubmit = async () => {
    await onCancel(comment || undefined)
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-destructive/8 border border-destructive/20 space-y-2">
              <p className="text-xs text-destructive leading-relaxed">Заказ будет отменён.</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Причина отмены (необязательно)..."
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex gap-2"
          >
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="flex-1 h-9 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              className="flex-1 h-9 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-destructive/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Подтвердить отмену
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="cancel-cta"
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="w-full h-9 rounded-xl border border-destructive/30 text-destructive text-sm flex items-center justify-center hover:bg-destructive/8 transition-colors cursor-pointer disabled:opacity-50"
          >
            Отменить заказ
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

interface OrderDetailModalProps {
  orderId: string | null
  onClose: () => void
  onActionDone: () => void
}

export function OrderDetailModal({ orderId, onClose, onActionDone }: OrderDetailModalProps) {
  const {
    order,
    loading,
    error,
    actionBusy,
    actionError,
    courierApplications,
    appsLoading,
    reload,
    reloadApps,
    confirm,
    markReady,
    markReadyForCourier,
    startSellerDelivery,
    sellerPickedUp,
    sellerDelivered,
    cancel,
    openDispute,
    approveCourierApp,
    rejectCourierApp,
    uploadPhotos,
    deletePhoto,
    uploadDisputePhotos,
    deleteDisputePhoto,
  } = useOrderDetail(orderId)

  const { shop } = useShopById(order?.shopId ?? undefined)

  const isDeliveryOrder = order?.deliveryType === 'Delivery'
  const isSellerDelivery = order?.isSellerDelivery ?? false
  const hasCourierAssigned = !!order?.courierAssignment
  const assignedCourierRating = useCourierRating(order?.courierAssignment?.courierId)
  const pendingApps = courierApplications.filter((a) => a.status === 'Pending')

  const allowCourierDelivery = shop?.allowCourierDelivery ?? false
  const allowSellerDelivery = shop?.allowSellerDelivery ?? false
  const bothDeliveryModes = isDeliveryOrder && allowCourierDelivery && allowSellerDelivery

  const canDispute =
    order?.status === 'Confirmed' ||
    order?.status === 'ReadyForPickup' ||
    order?.status === 'ReadyForCourier' ||
    order?.status === 'InDelivery'

  const handleConfirm = async () => {
    const ok = await confirm()
    if (ok) onActionDone()
  }

  const handleConfirmAndDeliver = async () => {
    const confirmOk = await confirm()
    if (!confirmOk) return
    await startSellerDelivery()
  }

  const handleMarkReady = async () => {
    const ok = await markReady()
    if (ok) onActionDone()
  }

  const handleMarkReadyForCourier = async () => {
    const ok = await markReadyForCourier()
    if (ok) onActionDone()
  }

  const handleStartSellerDelivery = async () => {
    await startSellerDelivery()
  }

  const handleSellerPickedUp = async () => {
    const ok = await sellerPickedUp()
    if (ok) onActionDone()
  }

  const handleSellerDelivered = async () => {
    const ok = await sellerDelivered()
    if (ok) onActionDone()
  }

  const handleCancel = async (comment?: string) => {
    const ok = await cancel(comment)
    if (ok) onActionDone()
    return ok
  }

  const canActOnOrder =
    order?.status === 'Pending' ||
    order?.status === 'Confirmed' ||
    order?.status === 'ReadyForCourier' ||
    (order?.status === 'InDelivery' && isSellerDelivery)

  const modal = (
    <AnimatePresence>
      {orderId && (
        <motion.div
          key="order-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            key="order-detail-panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Заказ #{shortOrderId(order?.id)}
                </h2>
                {order?.status && (
                  <OrderStatusBadge status={order.status} isSellerDelivery={isSellerDelivery} />
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={reload}
                  disabled={loading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                  title="Обновить заказ"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(order.createdAt)}
                    </span>
                    {order.shopName && (
                      <span className="flex items-center gap-1 truncate">
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        {order.shopName}
                      </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto shrink-0">
                      {order.deliveryType === 'Delivery' ? (
                        isSellerDelivery ? (
                          <>
                            <Truck className="w-3.5 h-3.5" /> Доставка магазином
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5" /> Курьер
                          </>
                        )
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5" /> Самовывоз
                        </>
                      )}
                    </span>
                  </div>

                  {/* Items */}
                  <OrderItemsSection order={order} />

                  {/* Delivery address */}
                  {order.deliveryType === 'Delivery' && order.deliveryAddress && (
                    <section>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Адрес доставки
                      </p>
                      <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-sm text-foreground space-y-1">
                        <p className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                          <span>
                            {[
                              order.deliveryAddress.city,
                              order.deliveryAddress.street,
                              order.deliveryAddress.houseNumber,
                              order.deliveryAddress.apartment &&
                                `кв. ${order.deliveryAddress.apartment}`,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </p>
                        {order.deliveryAddress.recipientName && (
                          <p className="text-xs text-muted-foreground pl-5">
                            {order.deliveryAddress.recipientName}
                            {order.deliveryAddress.recipientPhone &&
                              `, ${displayPhone(order.deliveryAddress.recipientPhone)}`}
                          </p>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Courier assignment */}
                  {order.courierAssignment && (
                    <section>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Курьер
                      </p>
                      <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-sm text-foreground">
                        <Link
                          to={`/couriers/${order.courierAssignment.courierId}`}
                          state={{
                            name: order.courierAssignment.courierName,
                            phone: order.courierAssignment.courierPhone,
                          }}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {order.courierAssignment.courierName ?? 'Не указано имя'}
                        </Link>
                        {order.courierAssignment.courierPhone && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            {displayPhone(order.courierAssignment.courierPhone)}
                          </p>
                        )}
                        {assignedCourierRating && (assignedCourierRating.reviewCount ?? 0) > 0 && (
                          <Link
                            to={`/couriers/${order.courierAssignment.courierId}`}
                            state={{
                              name: order.courierAssignment.courierName,
                              phone: order.courierAssignment.courierPhone,
                            }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
                          >
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                            {assignedCourierRating.averageRating?.toFixed(1)}
                            <span className="text-muted-foreground/60">
                              ({assignedCourierRating.reviewCount})
                            </span>
                          </Link>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Courier applications — shown only for Confirmed + Delivery, not seller delivery */}
                  {order.status === 'Confirmed' && isDeliveryOrder && !isSellerDelivery && (
                    <section>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Заявки курьеров
                        </p>
                        {appsLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {pendingApps.length > 0
                              ? `${pendingApps.length} ожидают`
                              : 'нет заявок'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={reloadApps}
                          disabled={appsLoading}
                          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={cn('w-3 h-3', appsLoading && 'animate-spin')} />
                          Обновить
                        </button>
                      </div>

                      {pendingApps.length === 0 && !appsLoading ? (
                        <div className="flex flex-col items-center gap-2 py-5 rounded-xl border border-dashed border-border">
                          <Users className="w-5 h-5 text-muted-foreground/50" />
                          <p className="text-xs text-muted-foreground">
                            Курьеры ещё не откликнулись
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pendingApps.map((app) => (
                            <CourierApplicationRow
                              key={app.id}
                              app={app}
                              busy={actionBusy}
                              onApprove={approveCourierApp}
                              onReject={rejectCourierApp}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Buyer comment */}
                  {order.buyerComment && (
                    <section>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Комментарий покупателя
                      </p>
                      <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-sm text-foreground flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                        <p>{order.buyerComment}</p>
                      </div>
                    </section>
                  )}

                  {/* Photos */}
                  <section>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Фотографии
                      {(order.photos?.length ?? 0) > 0 && (
                        <span className="text-muted-foreground/60">({order.photos?.length})</span>
                      )}
                    </p>
                    <OrderPhotosSection
                      photos={order.photos ?? []}
                      busy={actionBusy}
                      onUpload={async (files) => {
                        await uploadPhotos(files)
                      }}
                      onDelete={deletePhoto}
                    />
                  </section>

                  {/* Dispute */}
                  <DisputeBlock
                    dispute={order.dispute}
                    canOpenDispute={canDispute}
                    busy={actionBusy}
                    onOpen={openDispute}
                    onUploadPhoto={uploadDisputePhotos}
                    onDeletePhoto={deleteDisputePhoto}
                  />

                  {/* Status history */}
                  <StatusHistory history={order.statusHistory ?? []} dispute={order.dispute} />

                  {/* Action error */}
                  {actionError && <p className="text-xs text-destructive">{actionError}</p>}
                </>
              ) : null}
            </div>

            {/* Footer actions */}
            {canActOnOrder && !loading && (
              <div className="px-5 pb-4 pt-3 border-t border-border shrink-0 space-y-2">
                {order?.status === 'Pending' && (
                  <>
                    {bothDeliveryModes ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => void handleConfirm()}
                          disabled={actionBusy}
                          className="h-9 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 px-2"
                        >
                          {actionBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                          ) : (
                            <Users className="w-3 h-3 shrink-0" />
                          )}
                          Принять, найти курьера
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleConfirmAndDeliver()}
                          disabled={actionBusy}
                          className="h-9 rounded-xl border border-primary text-primary text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-primary/8 transition-colors cursor-pointer disabled:opacity-50 px-2"
                        >
                          {actionBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                          ) : (
                            <Truck className="w-3 h-3 shrink-0" />
                          )}
                          Принять, доставим сами
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleConfirm()}
                        disabled={actionBusy}
                        className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Подтвердить
                      </button>
                    )}
                    <CancelForm busy={actionBusy} onCancel={handleCancel} />
                  </>
                )}

                {order?.status === 'Confirmed' && (
                  <>
                    {/* Pickup: standard "Готов к выдаче" → ReadyForPickup */}
                    {!isDeliveryOrder && (
                      <button
                        type="button"
                        onClick={() => void handleMarkReady()}
                        disabled={actionBusy}
                        className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Store className="w-3.5 h-3.5" />
                        )}
                        Готов к выдаче
                      </button>
                    )}
                    {/* Delivery + courier assigned: → ReadyForCourier */}
                    {isDeliveryOrder && hasCourierAssigned && (
                      <button
                        type="button"
                        onClick={() => void handleMarkReadyForCourier()}
                        disabled={actionBusy}
                        className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Truck className="w-3.5 h-3.5" />
                        )}
                        Готов к передаче курьеру
                      </button>
                    )}
                    {/* Delivery + no courier + seller can deliver themselves */}
                    {isDeliveryOrder && !hasCourierAssigned && allowSellerDelivery && (
                      <button
                        type="button"
                        onClick={() => void handleStartSellerDelivery()}
                        disabled={actionBusy}
                        className="w-full h-9 rounded-xl border border-primary text-primary text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/8 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Truck className="w-3.5 h-3.5" />
                        )}
                        Доставить самостоятельно
                      </button>
                    )}
                    <CancelForm busy={actionBusy} onCancel={handleCancel} />
                  </>
                )}

                {order?.status === 'ReadyForCourier' && (
                  <>
                    {isSellerDelivery && (
                      <button
                        type="button"
                        onClick={() => void handleSellerPickedUp()}
                        disabled={actionBusy}
                        className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Truck className="w-3.5 h-3.5" />
                        )}
                        Забрал товар, везу покупателю
                      </button>
                    )}
                    <CancelForm busy={actionBusy} onCancel={handleCancel} />
                  </>
                )}

                {order?.status === 'InDelivery' && isSellerDelivery && (
                  <button
                    type="button"
                    onClick={() => void handleSellerDelivered()}
                    disabled={actionBusy}
                    className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Доставлено
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
