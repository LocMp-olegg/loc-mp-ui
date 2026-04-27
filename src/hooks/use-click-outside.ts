import { useEffect, useLayoutEffect, useRef } from 'react'
import type * as React from 'react'

interface Entry {
  ref: React.RefObject<HTMLElement | null>
  onClose: () => void
}

export function useClickOutside(entries: Entry[]) {
  const entriesRef = useRef(entries)

  useLayoutEffect(() => {
    entriesRef.current = entries
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      for (const { ref, onClose } of entriesRef.current) {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
}
