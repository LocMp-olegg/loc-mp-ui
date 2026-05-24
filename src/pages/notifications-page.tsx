import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BellOff,
  CheckCheck,
  ExternalLink,
  Loader2,
  Mail,
  Package,
  MessageSquare,
  Cpu,
  ShoppingBag,
  AlertTriangle,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotifications } from '@/hooks/use-notifications'
import { useNotificationPreferences } from '@/hooks/use-notification-preferences'
import type { NotificationDto } from '@/api/notifications'
import type { NotificationType } from '@/api/notifications'
import {
  NOTIFICATION_LABELS,
  CATEGORY_COLORS,
  CATEGORY_DOT_COLORS,
  notificationCategory,
  notificationLink,
} from '@/lib/notifications'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (itemDay.getTime() === today.getTime()) return 'Сегодня'
  if (itemDay.getTime() === yesterday.getTime()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}


function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

type Grouped = { label: string; items: NotificationDto[] }[]

function groupByDay(items: NotificationDto[]): Grouped {
  const map = new Map<string, { label: string; items: NotificationDto[] }>()
  for (const item of items) {
    const key = dayKey(item.createdAt!)
    if (!map.has(key)) {
      map.set(key, { label: formatDate(item.createdAt!), items: [] })
    }
    map.get(key)!.items.push(item)
  }
  return Array.from(map.values())
}

// ── Type icon ─────────────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: NotificationType }) {
  const cat = notificationCategory(type)
  const colorClass = CATEGORY_COLORS[cat]
  let Icon = Bell
  if (cat === 'order') Icon = Package
  else if (cat === 'review') Icon = MessageSquare
  else if (cat === 'stock') Icon = ShoppingBag
  else if (cat === 'account') Icon = User
  else if (cat === 'chat') Icon = MessageSquare
  else if (cat === 'system') Icon = Cpu

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
        colorClass,
      )}
    >
      <Icon className="w-4 h-4" />
    </div>
  )
}

// ── Notification card ─────────────────────────────────────────────────────────

function NotificationCard({
  item,
  onMarkRead,
}: {
  item: NotificationDto
  onMarkRead: (id: string) => void
}) {
  const cat = notificationCategory(item.type!)
  const dotColor = CATEGORY_DOT_COLORS[cat]
  const link = notificationLink(item)

  const cardClass = cn(
    'rounded-2xl border p-4 flex gap-3 transition-colors group/card',
    item.isRead ? 'border-border' : 'border-primary/20',
    link && 'hover:border-primary/40 cursor-pointer',
  )
  const cardStyle = {
    background: item.isRead
      ? 'color-mix(in srgb, var(--card) 60%, transparent)'
      : 'color-mix(in srgb, var(--card) 80%, transparent)',
  }

  const inner = (
    <>
      <NotificationIcon type={item.type!} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug',
              item.isRead ? 'font-normal text-foreground/80' : 'font-semibold text-foreground',
            )}
          >
            {item.title ?? NOTIFICATION_LABELS[item.type!]}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-muted-foreground">
              {item.createdAt ? timeAgo(item.createdAt, 'time') : ''}
            </span>
            {link && (
              <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover/card:text-primary transition-colors" />
            )}
          </div>
        </div>

        {item.body && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border',
              CATEGORY_COLORS[cat],
            )}
          >
            {NOTIFICATION_LABELS[item.type!]}
          </span>

          {!item.isRead && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onMarkRead(item.id!)
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
              Прочитано
            </button>
          )}
        </div>
      </div>
    </>
  )

  return link ? (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={link}
        onClick={() => {
          if (!item.isRead && item.id) onMarkRead(item.id)
        }}
        className={cardClass}
        style={cardStyle}
      >
        {inner}
      </Link>
    </motion.div>
  ) : (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cardClass}
      style={cardStyle}
    >
      {inner}
    </motion.div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-10 h-5.5 rounded-full transition-colors duration-200 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-default',
        checked ? 'bg-primary' : 'bg-muted-foreground/25',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[18px]' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ── Preferences section ────────────────────────────────────────────────────────

function PreferencesSection() {
  const { prefs, loading, saving, error, updatePreferences } = useNotificationPreferences()

  if (loading) {
    return (
      <div className="rounded-2xl border border-border p-6 space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded-xl" />
        ))}
      </div>
    )
  }

  if (!prefs) return null

  const toggle = (key: keyof typeof prefs) => async (val: boolean) => {
    await updatePreferences({ ...prefs, [key]: val })
  }

  return (
    <div
      className="rounded-2xl border border-border p-5 space-y-5"
      style={{ background: 'color-mix(in srgb, var(--card) 60%, transparent)' }}
    >
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Настройки уведомлений</h2>
        {saving && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin ml-auto" />}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/8 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* In-app */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          В приложении
        </p>
        <div className="space-y-3">
          <ToggleRow
            label="Обновления заказов"
            description="Статусы заказов, споры"
            checked={prefs.orderUpdates ?? true}
            onChange={toggle('orderUpdates')}
            disabled={saving}
          />
          <ToggleRow
            label="Ответы на отзывы"
            description="Когда продавец ответил на ваш отзыв"
            checked={prefs.reviewReplies ?? true}
            onChange={toggle('reviewReplies')}
            disabled={saving}
          />
          <ToggleRow
            label="Системные оповещения"
            description="Остатки товаров, статус аккаунта"
            checked={prefs.systemAlerts ?? true}
            onChange={toggle('systemAlerts')}
            disabled={saving}
          />
          <ToggleRow
            label="Сообщения в чатах"
            description="Новые сообщения от пользователей и поддержки"
            checked={prefs.chatMessages ?? true}
            onChange={toggle('chatMessages')}
            disabled={saving}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Email-уведомления
        </p>
        <div className="space-y-3">
          <ToggleRow
            label="Email включён"
            description="Главный переключатель всех email-уведомлений"
            checked={prefs.emailEnabled ?? true}
            onChange={toggle('emailEnabled')}
            disabled={saving}
            icon={Mail}
          />
          <div
            className={cn(
              'space-y-3 transition-opacity duration-200',
              !prefs.emailEnabled && 'opacity-40 pointer-events-none',
            )}
          >
            <ToggleRow
              label="Заказы на email"
              description="Подтверждение, статусы, отмена"
              checked={prefs.emailOrderUpdates ?? true}
              onChange={toggle('emailOrderUpdates')}
              disabled={saving || !prefs.emailEnabled}
            />
            <ToggleRow
              label="Отзывы на email"
              description="Когда получен новый отзыв"
              checked={prefs.emailReviewReplies ?? true}
              onChange={toggle('emailReviewReplies')}
              disabled={saving || !prefs.emailEnabled}
            />
            <ToggleRow
              label="Сообщения на email"
              description="Уведомление о новом сообщении в чате"
              checked={prefs.emailChatMessages ?? true}
              onChange={toggle('emailChatMessages')}
              disabled={saving || !prefs.emailEnabled}
            />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
        Обязательные уведомления (блокировка аккаунта, споры) всегда отправляются на email — они не
        зависят от настроек.
      </p>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  icon: Icon = AlertTriangle,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  icon?: React.ElementType
}) {
  void Icon
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const {
    items,
    totalCount,
    hasNextPage,
    loading,
    unreadCount,
    onlyUnread,
    setOnlyUnread,
    loadMore,
    markRead,
    markAllRead,
  } = useNotifications()

  const grouped = useMemo(() => groupByDay(items), [items])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Уведомления</h1>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {items.length}
            {hasNextPage ? '+' : ''} из {totalCount}
          </span>
        )}
        {unreadCount > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Прочитать все ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[
          { label: 'Все', value: false },
          { label: 'Непрочитанные', value: true },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => setOnlyUnread(opt.value)}
            className={cn(
              'h-8 px-3.5 rounded-xl text-sm font-medium transition-colors cursor-pointer',
              onlyUnread === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {opt.label}
            {opt.value && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] font-bold opacity-80">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border h-20 animate-pulse bg-card/60"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border border-border p-14 flex flex-col items-center gap-3 text-center"
          style={{ background: 'color-mix(in srgb, var(--card) 60%, transparent)' }}
        >
          <BellOff className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {onlyUnread ? 'Все уведомления прочитаны' : 'Уведомлений пока нет'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onMarkRead={(id) => void markRead(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && !loading && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
          >
            Показать ещё
          </button>
        </div>
      )}

      {loading && items.length > 0 && (
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Preferences */}
      <PreferencesSection />
    </div>
  )
}
