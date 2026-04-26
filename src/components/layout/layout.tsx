import { Outlet } from 'react-router-dom'
import { FloatingNav } from '@/components/aceternity/floating-nav'
import { LandscapeBackground } from './landscape-background'

export function Layout() {
  return (
    <div className="min-h-screen">
      <LandscapeBackground />
      <FloatingNav />
      <main>
        <div
          className="min-h-screen pt-14"
          style={{ background: 'color-mix(in srgb, var(--background) 75%, transparent)' }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
