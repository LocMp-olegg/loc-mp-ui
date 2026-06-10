import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { BoundedSuggestion } from '@/lib/geo'

const MARGIN = 8
const MIN_WIDTH = 240
const MAX_DROP_H = 192

interface DropPos {
  top: number
  left: number
  width: number
}

function calcPos(anchor: HTMLElement): DropPos {
  const r = anchor.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const dropW = Math.min(Math.max(r.width, MIN_WIDTH), vw - MARGIN * 2)

  let left = r.left
  if (left + dropW > vw - MARGIN) {
    left = r.right - dropW
  }
  left = Math.max(MARGIN, Math.min(left, vw - dropW - MARGIN))

  const spaceBelow = vh - r.bottom - MARGIN
  const top =
    spaceBelow >= MAX_DROP_H
      ? r.bottom + 4
      : Math.max(MARGIN, r.top - 4 - Math.min(MAX_DROP_H, spaceBelow < 80 ? MAX_DROP_H : spaceBelow))

  return { top, left, width: dropW }
}

interface FieldSugDropdownProps {
  open: boolean
  items: BoundedSuggestion[]
  onSelect: (s: BoundedSuggestion) => void
  variant?: 'default' | 'dark'
  anchorRef?: RefObject<HTMLElement | null>
}

export function FieldSugDropdown({
  open,
  items,
  onSelect,
  variant = 'default',
  anchorRef,
}: FieldSugDropdownProps) {
  const isDark = variant === 'dark'
  const isPortal = !!anchorRef
  const [pos, setPos] = useState<DropPos | null>(null)

  useLayoutEffect(() => {
    if (!anchorRef?.current || !open) return
    setPos(calcPos(anchorRef.current))
  }, [open, anchorRef])

  const dropdown = (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className={`${
            !isPortal ? 'absolute top-full left-0 right-0 mt-1 z-50 ' : ''
          }rounded-xl overflow-hidden border shadow-xl max-h-48 overflow-y-auto ${
            isDark ? 'border-white/10 backdrop-blur-xl' : 'border-border bg-card'
          }`}
          style={
            isPortal && pos
              ? {
                  position: 'fixed' as const,
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  zIndex: 9999,
                  ...(isDark
                    ? { background: 'color-mix(in srgb, var(--nav-bg) 90%, transparent)' }
                    : undefined),
                }
              : isDark
                ? { background: 'color-mix(in srgb, var(--nav-bg) 90%, transparent)' }
                : undefined
          }
        >
          {items.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(s)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                isDark ? 'text-nav-text/80 hover:bg-white/5' : 'text-foreground/80 hover:bg-muted'
              }`}
            >
              <MapPin
                className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-nav-text/40' : 'text-muted-foreground'}`}
              />
              {s.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (isPortal) {
    return pos ? createPortal(dropdown, document.body) : null
  }
  return dropdown
}
