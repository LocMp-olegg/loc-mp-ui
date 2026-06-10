import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCourierProfile } from '@/hooks/use-courier-profile'
import { useCourierAvailableOrders } from '@/hooks/use-courier-available-orders'
import { useCourierMyDeliveries } from '@/hooks/use-courier-my-deliveries'
import { useAuth } from '@/contexts/auth-context'
import { UserProfileService } from '@/api/identity'
import { AvailableOrderCard } from '@/components/courier/available-order-card'
import { CourierOrderModal } from '@/components/courier/courier-order-modal'
import { MyApplicationCard } from '@/components/courier/my-application-card'
import { ActiveDeliveryCard } from '@/components/courier/active-delivery-card'
import { SwitchTabs } from '@/components/ui/switch-tabs'
import { tabSlideVariants } from '@/lib/tab-variants'
import { cn } from '@/lib/utils'

type Tab = 'available' | 'my'

function NoLocation() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <MapPin className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">Базовая точка не указана</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Укажите базовую точку в настройках профиля, чтобы видеть доступные заказы
      </p>
      <Link
        to="/courier/profile"
        className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Перейти в профиль
      </Link>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </p>
  )
}

const TABS = [
  { key: 'available', label: 'Доступные' },
  { key: 'my', label: 'Мои доставки' },
] as const

const TAB_ORDER: Tab[] = ['available', 'my']

export function CourierOrdersPage() {
  const [tab, setTab] = useState<Tab>('available')
  const [direction, setDirection] = useState(0)

  const handleTabChange = (next: Tab) => {
    if (next === tab) return
    setDirection(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? 1 : -1)
    setTab(next)
  }
  const { user } = useAuth()
  const navigate = useNavigate()
  const { profile, loading: profileLoading } = useCourierProfile()

  const [userPhone, setUserPhone] = useState<string | null | undefined>(undefined)
  const [courierName, setCourierName] = useState<string | null>(null)

  useEffect(() => {
    UserProfileService.getApiIdentityProfile()
      .then((data) => {
        const raw = data.phoneNumber ?? ''
        const digits = raw.replace(/\D/g, '').replace(/^7/, '').slice(0, 10)
        setUserPhone(digits || null)
        const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')
        setCourierName(fullName || data.userName || user?.username || null)
      })
      .catch(() => setUserPhone(null))
  }, [user?.username])

  const lat = profile?.baseLatitude ?? null
  const lng = profile?.baseLongitude ?? null
  const radiusKm = (profile?.serviceRadiusMeters ?? 5000) / 1000

  const available = useCourierAvailableOrders({ latitude: lat, longitude: lng, radiusKm })
  const myDeliveries = useCourierMyDeliveries()

  // Sync pending applications into appliedIds so state survives page refresh
  useEffect(() => {
    if (myDeliveries.loading) return
    const ids = myDeliveries.applications.map((a) => a.orderId ?? '').filter(Boolean)
    if (ids.length > 0) available.syncApplied(ids)
  }, [myDeliveries.loading, myDeliveries.applications]) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedAppOrderId, setSelectedAppOrderId] = useState<string | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

  const handleApply = async (orderId: string) => {
    if (!userPhone) {
      navigate('/profile')
      return
    }
    await available.apply(orderId, {
      courierName,
      courierPhone: userPhone,
      latitude: lat,
      longitude: lng,
    })
    myDeliveries.reload()
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <CourierOrderModal
        orderId={selectedOrderId}
        applied={available.appliedIds.has(selectedOrderId ?? '')}
        onClose={() => setSelectedOrderId(null)}
        onApply={async (id) => {
          await handleApply(id)
        }}
        courierLat={lat}
        courierLng={lng}
      />
      <CourierOrderModal
        orderId={selectedAppOrderId}
        onClose={() => {
          setSelectedAppOrderId(null)
          setSelectedAppId(null)
        }}
        courierLat={lat}
        courierLng={lng}
        applicationId={selectedAppId}
        onWithdraw={myDeliveries.withdraw}
      />
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <SwitchTabs
          tabs={TABS}
          active={tab}
          onChange={handleTabChange}
          layoutId="courier-tab-indicator"
          className="mb-6"
        />

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={tab}
              custom={direction}
              variants={tabSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* ── Tab: Доступные ── */}
              {tab === 'available' && (
                <>
                  {lat == null || lng == null ? (
                    <NoLocation />
                  ) : (
                    <>
                      {userPhone === null && (
                        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                          <p className="flex-1 text-sm text-amber-700 dark:text-amber-400">
                            Укажите номер телефона, чтобы откликаться на заказы
                          </p>
                          <Link
                            to="/profile"
                            className="shrink-0 text-xs font-medium text-primary hover:underline"
                          >
                            В профиль
                          </Link>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-muted-foreground">
                          Радиус{' '}
                          {radiusKm < 1 ? `${Math.round(radiusKm * 1000)} м` : `${radiusKm} км`}
                          {available.totalCount > 0 && ` · ${available.totalCount} заказов`}
                        </p>
                        <button
                          type="button"
                          onClick={available.reload}
                          disabled={available.loading}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={cn('w-3 h-3', available.loading && 'animate-spin')}
                          />
                          Обновить
                        </button>
                      </div>

                      {available.loading && available.orders.length === 0 ? (
                        <div className="flex justify-center py-16">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : available.error ? (
                        <p className="text-sm text-destructive text-center py-16">
                          {available.error}
                        </p>
                      ) : available.orders.length === 0 ? (
                        <EmptyState text="Нет доступных заказов в вашем районе" />
                      ) : (
                        <div className="space-y-3">
                          {available.orders.map((order) => (
                            <AvailableOrderCard
                              key={order.id}
                              order={order}
                              applied={available.appliedIds.has(order.id ?? '')}
                              onClick={() => setSelectedOrderId(order.id ?? '')}
                            />
                          ))}
                          {available.hasNextPage && (
                            <button
                              type="button"
                              onClick={available.loadMore}
                              disabled={available.loading}
                              className="w-full h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {available.loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                              ) : (
                                'Загрузить ещё'
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Tab: Мои доставки ── */}
              {tab === 'my' && (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={myDeliveries.reload}
                      disabled={myDeliveries.loading}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={cn('w-3 h-3', myDeliveries.loading && 'animate-spin')}
                      />
                      Обновить
                    </button>
                  </div>

                  {myDeliveries.loading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : myDeliveries.error ? (
                    <p className="text-sm text-destructive text-center py-16">
                      {myDeliveries.error}
                    </p>
                  ) : myDeliveries.activeOrders.length === 0 &&
                    myDeliveries.applications.length === 0 ? (
                    <EmptyState text="Нет активных заявок и доставок" />
                  ) : (
                    <div className="space-y-5">
                      {myDeliveries.activeOrders.length > 0 && (
                        <div>
                          <SectionLabel>Активные доставки</SectionLabel>
                          <div className="space-y-3">
                            {myDeliveries.activeOrders.map((order) => (
                              <ActiveDeliveryCard
                                key={order.id}
                                order={order}
                                onPickup={myDeliveries.pickup}
                                onDeliver={myDeliveries.deliver}
                                courierLat={lat}
                                courierLng={lng}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {myDeliveries.applications.length > 0 && (
                        <div>
                          <SectionLabel>Ожидают ответа продавца</SectionLabel>
                          <div className="space-y-2">
                            {myDeliveries.applications.map((app) => (
                              <MyApplicationCard
                                key={app.id}
                                application={app}
                                onWithdraw={myDeliveries.withdraw}
                                onOpen={(orderId, appId) => {
                                  setSelectedAppOrderId(orderId)
                                  setSelectedAppId(appId)
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
