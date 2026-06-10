import { Info } from 'lucide-react'

export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center">
      <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl border border-border bg-card px-3 py-2 text-xs leading-snug text-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 text-left font-normal normal-case">
        {text}
      </span>
    </span>
  )
}
