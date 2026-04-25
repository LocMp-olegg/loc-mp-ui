import { Outlet } from 'react-router-dom'
import { FloatingNav } from '@/components/aceternity/floating-nav'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  )
}
