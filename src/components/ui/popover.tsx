import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import * as React from 'react'

export function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />
}

export function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />
}

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-60 w-auto rounded-2xl border border-border shadow-2xl backdrop-blur-md outline-none',
          className,
        )}
        style={{ background: 'color-mix(in srgb, var(--card) 92%, transparent)' }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
