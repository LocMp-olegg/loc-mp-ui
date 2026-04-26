import { ArrowDown, ArrowUp, Clock, RotateCcw, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReviewSortBy } from '@/api/reviews'

const SORT_OPTIONS: { key: ReviewSortBy; label: string; icon: React.ReactNode }[] = [
  {
    key: 'DateDesc',
    label: 'Сначала новые',
    icon: (
      <>
        <Clock className="w-3 h-3" />
        <ArrowDown className="w-3 h-3" />
      </>
    ),
  },
  {
    key: 'DateAsc',
    label: 'Сначала старые',
    icon: (
      <>
        <Clock className="w-3 h-3" />
        <ArrowUp className="w-3 h-3" />
      </>
    ),
  },
  {
    key: 'RatingDesc',
    label: 'Сначала высокий рейтинг',
    icon: (
      <>
        <Star className="w-3 h-3" />
        <ArrowDown className="w-3 h-3" />
      </>
    ),
  },
  {
    key: 'RatingAsc',
    label: 'Сначала низкий рейтинг',
    icon: (
      <>
        <Star className="w-3 h-3" />
        <ArrowUp className="w-3 h-3" />
      </>
    ),
  },
]

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-foreground text-background text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
        {text}
      </div>
    </div>
  )
}

function StarFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer',
          value === null
            ? 'border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400'
            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
        )}
      >
        Все
      </button>
      {[5, 4, 3, 2, 1].map((s) => (
        <button
          key={s}
          onClick={() => onChange(value === s ? null : s)}
          className={cn(
            'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer',
            value === s
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
          )}
        >
          {s}
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        </button>
      ))}
    </div>
  )
}

interface Props {
  sort: ReviewSortBy
  filterStar: number | null
  setSort: (s: ReviewSortBy) => void
  setFilterStar: (r: number | null) => void
  reset: () => void
}

export function ReviewsControls({ sort, filterStar, setSort, setFilterStar, reset }: Props) {
  const isFiltered = filterStar !== null || sort !== 'DateDesc'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <StarFilter value={filterStar} onChange={setFilterStar} />
        {isFiltered && (
          <Tooltip text="Сбросить фильтры и сортировку">
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Сбросить
            </button>
          </Tooltip>
        )}
      </div>

      <div className="flex gap-1">
        {SORT_OPTIONS.map((opt) => (
          <Tooltip key={opt.key} text={opt.label}>
            <button
              onClick={() => setSort(opt.key)}
              className={cn(
                'flex items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors cursor-pointer',
                sort === opt.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {opt.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
