import { useReducer, useEffect, useState } from 'react'
import { X, Plus, Loader2, Tag } from 'lucide-react'
import { ProductsService, TagsService } from '@/api/catalog'
import type { TagDto } from '@/api/catalog'
import { cn } from '@/lib/utils'

type State = {
  allTagsMap: Map<string, TagDto>
  localAdded: TagDto[]
  deletedIds: Set<string>
}

type Action =
  | { type: 'loadTags'; tags: TagDto[] }
  | { type: 'add'; tag: TagDto }
  | { type: 'remove'; id: string }
  | { type: 'sync'; initialTags: string[] }

function reducer(state: State, action: Action): State {
  if (action.type === 'loadTags') {
    const map = new Map(action.tags.filter((t) => t.name && t.id).map((t) => [t.name!, t]))
    return { ...state, allTagsMap: map }
  }
  if (action.type === 'add') return { ...state, localAdded: [...state.localAdded, action.tag] }
  if (action.type === 'remove') {
    const deleted = new Set(state.deletedIds)
    deleted.add(action.id)
    return {
      ...state,
      localAdded: state.localAdded.filter((t) => t.id !== action.id),
      deletedIds: deleted,
    }
  }
  if (action.type === 'sync') {
    return {
      ...state,
      localAdded: state.localAdded.filter((t) => !action.initialTags.includes(t.name ?? '')),
      deletedIds: new Set(),
    }
  }
  return state
}

interface ProductTagsSectionProps {
  productId: string
  initialTags: string[]
}

export function ProductTagsSection({ productId, initialTags }: ProductTagsSectionProps) {
  const [state, dispatch] = useReducer(reducer, {
    allTagsMap: new Map<string, TagDto>(),
    localAdded: [] as TagDto[],
    deletedIds: new Set<string>(),
  })
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    TagsService.getApiCatalogTags()
      .then((tags) => dispatch({ type: 'loadTags', tags }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    dispatch({ type: 'sync', initialTags })
  }, [initialTags])

  const resolvedInitial: TagDto[] = initialTags
    .map((name) => state.allTagsMap.get(name) ?? state.localAdded.find((t) => t.name === name))
    .filter((t): t is TagDto => t !== undefined && !state.deletedIds.has(t.id ?? ''))

  const pendingAdded = state.localAdded.filter((t) => !initialTags.includes(t.name ?? ''))

  const displayTags = [...resolvedInitial, ...pendingAdded]

  const handleAdd = async () => {
    const name = input.trim()
    if (!name || adding) return
    const lc = name.toLowerCase()
    if (displayTags.some((t) => (t.name ?? '').toLowerCase() === lc)) {
      setInput('')
      return
    }
    setAdding(true)
    setError(null)
    try {
      const tag = await ProductsService.postApiCatalogProductsTags({
        id: productId,
        requestBody: { tagName: name },
      })
      dispatch({ type: 'add', tag })
      setInput('')
    } catch {
      setError('Не удалось добавить тег')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (tag: TagDto) => {
    if (!tag.id || deletingId) return
    setDeletingId(tag.id)
    setError(null)
    try {
      await ProductsService.deleteApiCatalogProductsTags({ id: productId, tagId: tag.id })
      dispatch({ type: 'remove', id: tag.id })
    } catch {
      setError('Не удалось удалить тег')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className={cn('flex flex-wrap gap-1.5', displayTags.length > 0 && 'mb-3')}>
        {displayTags.map((tag) => (
          <span
            key={tag.id ?? tag.name}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
          >
            <Tag className="w-3 h-3" />
            {tag.name}
            {tag.id && (
              <button
                type="button"
                onClick={() => void handleDelete(tag)}
                disabled={deletingId === tag.id}
                className="ml-0.5 hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingId === tag.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            )}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            const sanitized = e.target.value.replace(/ /g, '-').replace(/[^\p{L}\p{N}.;-]/gu, '')
            setInput(sanitized)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleAdd()
            }
          }}
          placeholder="Новый тег..."
          maxLength={50}
          className="flex-1 h-9 px-3 text-sm bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={!input.trim() || adding}
          className={cn(
            'h-9 px-3 rounded-xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50',
            'bg-primary/12 text-primary hover:bg-primary/20',
          )}
        >
          {adding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Добавить
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
