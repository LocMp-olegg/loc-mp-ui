import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Loader2 } from 'lucide-react'
import { GlowInput } from '@/components/ui/glow-input'
import { suggestAddress } from '@/lib/geo'
import type { GeoSuggestion } from '@/lib/geo'
import * as React from 'react'

export function AddressPicker({
  query,
  onQueryChange,
  onSelect,
  onBlur,
  error,
}: {
  query: string
  onQueryChange: (q: string) => void
  onSelect: (s: GeoSuggestion) => void
  onBlur?: () => void
  error?: string
}) {
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleChange = (q: string) => {
    onQueryChange(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(() => {
      suggestAddress(q).then((res) => {
        setSuggestions(res)
        setOpen(res.length > 0)
        setLoading(false)
      })
    }, 300)
  }

  // Compute fixed position when dropdown opens
  useEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [open])

  // Close on any scroll while open
  useEffect(() => {
    if (!open) return
    const handleScroll = () => setOpen(false)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <GlowInput
        icon={MapPin}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Начните вводить адрес..."
        onClear={query ? () => handleChange('') : undefined}
        error={error}
        rightSlot={
          loading ? <Loader2 className="w-4 h-4 text-nav-text/75 animate-spin" /> : undefined
        }
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                ...dropdownStyle,
                background: 'color-mix(in srgb, var(--card) 90%, transparent)',
              }}
              className="dark rounded-xl border border-border/50 shadow-xl backdrop-blur-md overflow-hidden max-h-60 overflow-y-auto"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(s)
                    setSuggestions([])
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-nav-text hover:bg-white/8 transition-colors border-b border-white/8 last:border-none"
                >
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
