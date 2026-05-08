import { useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ProfileSelect } from '@/components/ui/profile-select'
import { DatePickerField } from '@/components/auth/date-picker-field'
import { cn } from '@/lib/utils'
import type { OrderStatus, DeliveryType, OrderSortField } from '@/api/orders'
import type { ShopDto } from '@/api/catalog'

const STATUS_PILLS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'Все', value: '' },
  { label: 'Новые', value: 'Pending' },
  { label: 'Подтверждённые', value: 'Confirmed' },
  { label: 'Готов к выдаче', value: 'ReadyForPickup' },
  { label: 'Доставляются', value: 'InDelivery' },
  { label: 'Завершённые', value: 'Completed' },
  { label: 'Отменённые', value: 'Cancelled' },
  { label: 'Спор', value: 'Disputed' },
]

const DELIVERY_OPTIONS = [
  { value: '', label: 'Любая доставка' },
  { value: 'Pickup', label: 'Самовывоз' },
  { value: 'NeighborCourier', label: 'Курьер' },
]

const SORT_OPTIONS: { value: OrderSortField | ''; label: string }[] = [
  { value: '', label: 'По умолчанию' },
  { value: 'Date', label: 'По дате' },
  { value: 'Amount', label: 'По сумме' },
]

interface OrderFiltersProps {
  statusFilter: OrderStatus | ''
  onStatusChange: (s: OrderStatus | '') => void
  shopFilter: string
  onShopChange: (s: string) => void
  deliveryFilter: DeliveryType | ''
  onDeliveryChange: (d: DeliveryType | '') => void
  from: string
  onFromChange: (s: string) => void
  to: string
  onToChange: (s: string) => void
  sortBy: OrderSortField | ''
  onSortByChange: (s: OrderSortField | '') => void
  descending: boolean
  onDescendingChange: (d: boolean) => void
  shops: ShopDto[]
}

export function OrderFilters({
  statusFilter,
  onStatusChange,
  shopFilter,
  onShopChange,
  deliveryFilter,
  onDeliveryChange,
  from,
  onFromChange,
  to,
  onToChange,
  sortBy,
  onSortByChange,
  descending,
  onDescendingChange,
  shops,
}: OrderFiltersProps) {
  const shopOptions = useMemo(
    () => [
      { value: '', label: 'Все магазины' },
      ...shops.map((s) => ({ value: s.id ?? '', label: s.businessName ?? 'Без названия' })),
    ],
    [shops],
  )

  const today = useMemo(() => new Date(), [])
  const startMonth = useMemo(() => new Date(today.getFullYear() - 3, 0), [today])

  return (
    <div className="space-y-3">
      {/* Status pills */}
      <div className="flex flex-wrap gap-1">
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => onStatusChange(pill.value)}
            className={cn(
              'h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              statusFilter === pill.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-2">
        {shops.length > 1 && (
          <ProfileSelect
            options={shopOptions}
            value={shopFilter}
            onChange={onShopChange}
            placeholder="Все магазины"
            className="w-44"
          />
        )}
        <ProfileSelect
          options={DELIVERY_OPTIONS}
          value={deliveryFilter}
          onChange={(v) => onDeliveryChange(v as DeliveryType | '')}
          placeholder="Любая доставка"
          className="w-40"
        />
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-40">
          <DatePickerField
            value={from}
            onChange={onFromChange}
            variant="light"
            startMonth={startMonth}
            endMonth={today}
            disabledDates={(date) => date > today}
          />
        </div>
        <span className="text-xs text-muted-foreground">—</span>
        <div className="w-40">
          <DatePickerField
            value={to}
            onChange={onToChange}
            variant="light"
            startMonth={startMonth}
            endMonth={today}
            disabledDates={(date) => date > today}
          />
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <ProfileSelect
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(v) => onSortByChange(v as OrderSortField | '')}
          placeholder="По умолчанию"
          className="w-40"
        />
        <button
          type="button"
          title={descending ? 'По убыванию' : 'По возрастанию'}
          onClick={() => onDescendingChange(!descending)}
          className={cn(
            'h-10 w-10 rounded-xl border border-border flex items-center justify-center transition-colors cursor-pointer shrink-0',
            sortBy ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {sortBy ? (
            descending ? (
              <ArrowDown className="w-4 h-4" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4" />
          )}
        </button>
        {(sortBy || from || to) && (
          <button
            type="button"
            onClick={() => {
              onSortByChange('')
              onFromChange('')
              onToChange('')
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}
