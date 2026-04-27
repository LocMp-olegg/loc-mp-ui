import type * as React from 'react'
import type { ProductSortBy } from '@/api/catalog'
import {
  CalendarArrowDown,
  CalendarArrowUp,
  TrendingUp,
  TrendingDown,
  ArrowUpAZ,
  ArrowDownAZ,
} from 'lucide-react'

export const SORT_OPTIONS: {
  value: ProductSortBy
  label: string
  Icon: React.FC<{ className?: string }>
}[] = [
  { value: 'Newest', label: 'Новее', Icon: CalendarArrowDown },
  { value: 'Oldest', label: 'Старее', Icon: CalendarArrowUp },
  { value: 'PriceAsc', label: 'Дешевле', Icon: TrendingUp },
  { value: 'PriceDesc', label: 'Дороже', Icon: TrendingDown },
  { value: 'NameAsc', label: 'А → Я', Icon: ArrowUpAZ },
  { value: 'NameDesc', label: 'Я → А', Icon: ArrowDownAZ },
]

export const SORT_SEPARATORS = new Set([2, 4])

export const POPUP_ANIM = {
  initial: { opacity: 0, scale: 0.95, y: -6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -6 },
  transition: { duration: 0.13 },
} as const

export const POPUP_BASE =
  'absolute top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-xl backdrop-blur-md origin-top-right'

export function popupAlign(
  ref: React.RefObject<HTMLDivElement | null>,
  popupWidth: number,
): string {
  if (!ref.current) return 'right-0'
  const { right } = ref.current.getBoundingClientRect()
  return right - popupWidth < 8 ? 'left-0' : 'right-0'
}
