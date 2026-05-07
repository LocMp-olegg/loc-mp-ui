import { useState, useEffect, useReducer, useRef, type SyntheticEvent } from 'react'
import { Search, ArrowRight, Star, X, Hash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchSearchSuggestions, fetchTagSuggestions } from '@/lib/catalog'
import type { Product } from '@/types/product'
import type { TagDto } from '@/api/catalog'
import { cn } from '@/lib/utils'
import noImageUrl from '@/assets/no-image-available.jpg'
import { useUserLocation } from '@/contexts/location-context'

type SugState =
  | { mode: 'products'; suggestions: Product[]; open: boolean }
  | { mode: 'tags'; suggestions: TagDto[]; open: boolean }
  | { mode: 'none' }

type SugAction =
  | { type: 'set-products'; items: Product[] }
  | { type: 'set-tags'; items: TagDto[] }
  | { type: 'clear' }

function sugReducer(_: SugState, action: SugAction): SugState {
  if (action.type === 'set-products')
    return { mode: 'products', suggestions: action.items, open: action.items.length > 0 }
  if (action.type === 'set-tags')
    return { mode: 'tags', suggestions: action.items, open: action.items.length > 0 }
  return { mode: 'none' }
}

interface Props {
  onNavigate?: () => void
  className?: string
}

function isOpen(state: SugState): boolean {
  return state.mode !== 'none' && state.open
}

export function SearchBar({ onNavigate, className }: Props) {
  const [query, setQuery] = useState('')
  const [sugState, dispatch] = useReducer(sugReducer, { mode: 'none' })
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { location } = useUserLocation()

  const isTagMode = query.trimStart().startsWith('#')

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()

    if (isTagMode) {
      const tagQuery = trimmed.slice(1) // remove leading #
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await fetchTagSuggestions(tagQuery)
          dispatch({ type: 'set-tags', items: results })
        } catch {
          dispatch({ type: 'clear' })
        }
      }, 200)
    } else if (trimmed.length >= 2) {
      const geo = location
        ? { lat: location.lat, lng: location.lng, radiusKm: location.radius }
        : undefined
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await fetchSearchSuggestions(trimmed, geo)
          dispatch({ type: 'set-products', items: results })
        } catch {
          dispatch({ type: 'clear' })
        }
      }, 300)
    } else {
      dispatch({ type: 'clear' })
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [location, query, isTagMode])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dispatch({ type: 'clear' })
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    dispatch({ type: 'clear' })
    if (trimmed.startsWith('#')) {
      const tag = trimmed.slice(1).trim()
      if (tag) navigate(`/search?tag=${encodeURIComponent(tag)}`)
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
    onNavigate?.()
  }

  const handleClear = () => {
    setQuery('')
    dispatch({ type: 'clear' })
  }

  const handleProductClick = (product: Product) => {
    dispatch({ type: 'clear' })
    setQuery('')
    navigate(`/product/${product.id}`)
    onNavigate?.()
  }

  const handleTagClick = (tag: TagDto) => {
    dispatch({ type: 'clear' })
    setQuery('')
    navigate(`/search?tag=${encodeURIComponent(tag.name ?? '')}`)
    onNavigate?.()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nav-text/40 pointer-events-none z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (sugState.mode === 'products' && !sugState.open)
              dispatch({ type: 'set-products', items: sugState.suggestions })
            else if (sugState.mode === 'tags' && !sugState.open)
              dispatch({ type: 'set-tags', items: sugState.suggestions })
          }}
          onKeyDown={(e) => e.key === 'Escape' && dispatch({ type: 'clear' })}
          placeholder="Поиск, или # для тегов"
          className="w-full h-9 pl-9 pr-18 rounded-xl bg-white/8 border border-white/10 text-sm text-nav-text placeholder:text-nav-text/40 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-colors"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleClear}
            aria-label="Очистить"
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center text-nav-text/40 hover:text-nav-text/70 hover:bg-white/10 transition-all cursor-pointer',
              query ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="submit"
            aria-label="Найти"
            className="w-7 h-7 rounded-lg bg-primary/70 hover:bg-primary text-primary-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {isOpen(sugState) && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-60 rounded-xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl"
          style={{ background: 'color-mix(in srgb, var(--nav-bg) 90%, transparent)' }}
        >
          {sugState.mode === 'tags' &&
            sugState.suggestions.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors cursor-pointer text-left border-b border-white/5 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-nav-text leading-tight">#{tag.name}</p>
                  {(tag.productCount ?? 0) > 0 && (
                    <p className="text-xs text-nav-text/40 mt-0.5">{tag.productCount} товаров</p>
                  )}
                </div>
              </button>
            ))}

          {sugState.mode === 'products' &&
            sugState.suggestions.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/6 transition-colors cursor-pointer text-left border-b border-white/5 last:border-0"
              >
                <img
                  src={product.images[0] ?? noImageUrl}
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-nav-text truncate leading-tight">{product.name}</p>
                    {product.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-400 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {product.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xs text-nav-text/40 truncate block">
                      {product.shopName}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-nav-text shrink-0">
                  {product.price.toLocaleString('ru-RU')} ₽
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
