import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  Store,
  MessageSquare,
  CheckCircle,
  XCircle,
  Star,
} from 'lucide-react'
import { useOrderDetail } from '@/hooks/use-order-detail'
import { OrderStatusBadge } from '@/components/seller/orders/order-status-badge'
import { DisputeBlock } from '@/components/orders/dispute-block'
import { StatusHistory } from '@/components/orders/status-history'
import { pluralize } from '@/lib/utils'
import { formatDateTime, shortOrderId, displayPhone } from '@/lib/format'
import noImageUrl from '@/assets/no-image-available.jpg'

// ── Cancel form ───────────────────────────────────────────────────────────────

function CancelSection({ busy, onCancel }: { busy: boolean; onCancel: (comment?: string) => Promise<boolean> }) {
  const [confirming, setConfirming] = useState(false)
  const [comment, setComment] = useState('')

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
              <p className="text-xs text-destructive">Заказ будет отменён.</p>
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
            key="confirm"
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
              onClick={async () => {
                const ok = await onCancel(comment || undefined)
                if (ok) setConfirming(false)
              }}
              disabled={busy}
              className="flex-1 h-9 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-destructive/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Подтвердить отмену
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="cta"
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="w-full h-9 rounded-xl border border-destructive/30 text-destructive text-sm flex items-center justify-center gap-1.5 hover:bg-destructive/8 transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Отменить заказ
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Order detail page ─────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    order,
    loading,
    error,
    actionBusy,
    actionError,
    complete,
    cancel,
    openDispute,
    uploadDisputePhotos,
    deleteDisputePhoto,
  } = useOrderDetail(id ?? null)
  const status = order?.status
  const canCancel = status === 'Pending' || status === 'Confirmed'
  const canComplete = status === 'ReadyForPickup' || status === 'InDelivery'
  const canDispute = status === 'Confirmed' || status === 'ReadyForPickup' || status === 'InDelivery'
  const canReview = status === 'Completed'

  const itemCount = order?.items?.length ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к заказам
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Link to="/orders" className="text-xs text-primary hover:underline">
            К списку заказов
          </Link>
        </div>
      ) : order ? (
        <div className="space-y-4">
          {/* Header card */}
          <div
            className="rounded-2xl border border-border p-4 space-y-2"
            style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-mono">
                  Заказ #{shortOrderId(order.id)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} className="text-xs px-2 py-1 rounded-lg" />
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {order.shopName && (
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  {order.shopName}
                </span>
              )}
              <span className="flex items-center gap-1">
                {order.deliveryType === 'NeighborCourier' ? (
                  <>
                    <Truck className="w-3.5 h-3.5" /> Доставка курьером
                  </>
                ) : (
                  <>
                    <Store className="w-3.5 h-3.5" /> Самовывоз
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Items */}
          <section
            className="rounded-2xl border border-border overflow-hidden"
            style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
          >
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Товары
              </p>
              <span className="text-xs text-muted-foreground">
                {itemCount} {pluralize(itemCount, 'позиция', 'позиции', 'позиций')}
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {(order.items ?? []).map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <img
                    src={item.mainPhotoUrl ?? noImageUrl}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.productId}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} × {(item.unitPrice ?? 0).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground shrink-0">
                    {(item.subtotal ?? 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border/50 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Итого</span>
              <span className="text-base font-bold text-foreground">
                {(order.totalAmount ?? 0).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </section>

          {/* Delivery address */}
          {order.deliveryType === 'NeighborCourier' && order.deliveryAddress && (
            <section
              className="rounded-2xl border border-border p-4 space-y-1.5"
              style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Адрес доставки
              </p>
              <p className="flex items-start gap-2 text-sm text-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                <span>
                  {[
                    order.deliveryAddress.city,
                    order.deliveryAddress.street,
                    order.deliveryAddress.houseNumber,
                    order.deliveryAddress.apartment && `кв. ${order.deliveryAddress.apartment}`,
                    order.deliveryAddress.entrance && `подъезд ${order.deliveryAddress.entrance}`,
                    order.deliveryAddress.floor && `эт. ${order.deliveryAddress.floor}`,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </p>
              {order.deliveryAddress.recipientName && (
                <p className="text-xs text-muted-foreground pl-6">
                  {order.deliveryAddress.recipientName}
                  {order.deliveryAddress.recipientPhone &&
                    `, ${displayPhone(order.deliveryAddress.recipientPhone)}`}
                </p>
              )}
            </section>
          )}

          {/* Courier info */}
          {order.courierAssignment && (
            <section
              className="rounded-2xl border border-border p-4"
              style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Курьер
              </p>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm text-foreground">
                    {order.courierAssignment.courierName ?? 'Имя не указано'}
                  </p>
                  {order.courierAssignment.courierPhone && (
                    <p className="text-xs text-muted-foreground">
                      {displayPhone(order.courierAssignment.courierPhone)}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Dispute */}
          <DisputeBlock
            dispute={order.dispute}
            canOpenDispute={canDispute}
            busy={actionBusy}
            onOpen={openDispute}
            onUploadPhoto={uploadDisputePhotos}
            onDeletePhoto={deleteDisputePhoto}
          />

          {/* Buyer comment */}
          {order.buyerComment && (
            <section
              className="rounded-2xl border border-border p-4"
              style={{ background: 'color-mix(in srgb, var(--card) 80%, transparent)' }}
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Ваш комментарий
              </p>
              <p className="text-sm text-foreground">{order.buyerComment}</p>
            </section>
          )}

          {/* Status history */}
          <StatusHistory history={order.statusHistory ?? []} dispute={order.dispute} />

          {/* Action error */}
          {actionError && (
            <p className="text-xs text-destructive text-center">{actionError}</p>
          )}

          {/* Actions */}
          {(canComplete || canCancel || canReview) && (
            <section className="space-y-2">
              {canComplete && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await complete()
                    if (ok) navigate('/orders')
                  }}
                  disabled={actionBusy}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Подтвердить получение
                </button>
              )}

              {canCancel && (
                <CancelSection busy={actionBusy} onCancel={cancel} />
              )}

              {canReview && (
                <Link
                  to={`/reviews/new?orderId=${order.id}`}
                  className="w-full h-10 rounded-xl border border-primary/30 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/8 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Оставить отзыв
                </Link>
              )}
            </section>
          )}
        </div>
      ) : null}
    </div>
  )
}
