import { cn } from '@/lib/utils'

interface RadiusInputProps {
  unit: 'm' | 'km'
  value: string
  onChange: (val: string) => void
  onUnitToggle: (unit: 'm' | 'km') => void
}

export function RadiusInput({ unit, value, onChange, onUnitToggle }: RadiusInputProps) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="number"
        min="0"
        step={unit === 'km' ? '0.1' : '100'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={unit === 'km' ? 'напр. 1.5' : 'напр. 1500'}
        className="flex-1 h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-nav-text placeholder:text-nav-text/30 focus:outline-none focus:border-white/20 transition-colors input-no-spin"
      />
      <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
        {(['m', 'km'] as const).map((u) => (
          <button
            key={u}
            onClick={() => onUnitToggle(u)}
            className={cn(
              'px-3 h-8 text-xs transition-colors cursor-pointer',
              unit === u
                ? 'bg-primary text-primary-foreground'
                : 'text-nav-text/60 hover:text-nav-text hover:bg-white/5',
            )}
          >
            {u === 'm' ? 'м' : 'км'}
          </button>
        ))}
      </div>
    </div>
  )
}
