import { useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDateTime, shortOrderId } from '@/lib/format'
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
} from 'lucide-react'
import { OrderStatusBadge } from './order-status-badge'
import { OrderPhotosSection } from './order-photos-section'
import { DisputeBlock } from '@/components/orders/dispute-block'
import { StatusHistory } from '@/components/orders/status-history'
import { useOrderDetail } from '@/hooks/use-order-detail'
import { displayPhone } from '@/lib/format'
import noImageUrl from '@/assets/no-image-available.jpg'

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
    confirm,
    markReady,
    cancel,
    openDispute,
    uploadPhotos,
    deletePhoto,
    uploadDisputePhotos,
    deleteDisputePhoto,
  } = useOrderDetail(orderId)

  const canDispute =
    order?.status === 'Confirmed' ||
    order?.status === 'ReadyForPickup' ||
    order?.status === 'InDelivery'

  const handleConfirm = async () => {
    const ok = await confirm()
    if (ok) onActionDone()
  }

  const handleMarkReady = async () => {
    const ok = await markReady()
    if (ok) onActionDone()
  }

  const handleCancel = async (comment?: string) => {
    const ok = await cancel(comment)
    if (ok) onActionDone()
    return ok
  }

  const canActOnOrder = order?.status === 'Pending' || order?.status === 'Confirmed'

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
                      {order.deliveryType === 'NeighborCourier' ? (
                        <>
                          <Truck className="w-3.5 h-3.5" /> Курьер
                        </>
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5" /> Самовывоз
                        </>
                      )}
                    </span>
                  </div>

                  {/* Items */}
                  <section>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Товары
                    </p>
                    <div className="space-y-2">
                      {(order.items ?? []).map((item) => (
                        <div key={item.id} className="flex items-center gap-2.5">
                          <img
                            src={item.mainPhotoUrl ?? noImageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {item.unitPrice?.toFixed(2)} ₽
                            </p>
                          </div>
                          <p className="text-sm font-medium text-foreground shrink-0">
                            {item.subtotal?.toFixed(2)} ₽
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">Итого</span>
                      <span className="text-base font-semibold text-foreground">
                        {order.totalAmount?.toFixed(2)} ₽
                      </span>
                    </div>
                  </section>

                  {/* Delivery address */}
                  {order.deliveryType === 'NeighborCourier' && order.deliveryAddress && (
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
                        <p>{order.courierAssignment.courierName ?? 'Не указано имя'}</p>
                        {order.courierAssignment.courierPhone && (
                          <p className="text-xs text-muted-foreground">
                            {displayPhone(order.courierAssignment.courierPhone)}
                          </p>
                        )}
                      </div>
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
                    <button
                      type="button"
                      onClick={() => void handleConfirm()}
                      disabled={actionBusy}
                      className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Подтвердить
                    </button>
                    <CancelForm busy={actionBusy} onCancel={handleCancel} />
                  </>
                )}

                {order?.status === 'Confirmed' && (
                  <>
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
                    <CancelForm busy={actionBusy} onCancel={handleCancel} />
                  </>
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
