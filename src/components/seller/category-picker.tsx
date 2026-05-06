import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { CategoriesService } from '@/api/catalog'
import type { CategoryTreeDto } from '@/api/catalog'
import { cn } from '@/lib/utils'

type FlatCategory = { id: string; name: string; path: string }

function flattenLeaves(nodes: CategoryTreeDto[], parentPath = ''): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    if (!node.id || node.isActive === false) continue
    const children = (node.children ?? []).filter((c) => c.isActive !== false && c.id)
    const path = parentPath ? `${parentPath} › ${node.name ?? ''}` : (node.name ?? '')
    if (children.length === 0) {
      result.push({ id: node.id, name: node.name ?? '', path })
    } else {
      result.push(...flattenLeaves(children, path))
    }
  }
  return result
}

interface CategoryPickerProps {
  value: string
  onChange: (id: string, name: string) => void
  error?: boolean
  className?: string
}

export function CategoryPicker({ value, onChange, error, className }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<FlatCategory[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    CategoriesService.getApiCatalogCategoriesTree()
      .then((tree) => setCategories(flattenLeaves(tree)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = categories.find((c) => c.id === value)
  const filtered = search.trim()
    ? categories.filter((c) => c.path.toLowerCase().includes(search.toLowerCase()))
    : categories

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full h-10 px-3 rounded-xl border text-sm flex items-center justify-between gap-2 transition-all cursor-pointer outline-none',
          'bg-background text-foreground focus:ring-2 focus:ring-primary/25 focus:border-primary/50',
          error ? 'border-destructive' : 'border-border',
          !selected && 'text-muted-foreground/50',
        )}
      >
        <span className="truncate">{selected?.name ?? 'Выберите категорию'}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск категории..."
                className="w-full h-8 pl-8 pr-3 text-sm bg-muted rounded-lg outline-none text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                Ничего не найдено
              </p>
            ) : (
              filtered.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.id, cat.name)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer flex items-center justify-between gap-2',
                    cat.id === value
                      ? 'text-primary font-medium bg-primary/8'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <span className="truncate">{cat.path}</span>
                  {cat.id === value && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
