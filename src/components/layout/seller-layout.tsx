import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { Store, Package, ShoppingBag, BarChart2, ArrowLeft, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { LandscapeBackground } from './landscape-background'
import { RequireSeller } from '@/components/auth/require-seller'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/seller/shops', icon: Store, label: 'Магазины' },
  { to: '/seller/products', icon: Package, label: 'Товары' },
  { to: '/seller/orders', icon: ShoppingBag, label: 'Заказы' },
  { to: '/seller/analytics', icon: BarChart2, label: 'Аналитика' },
]

const PAGE_TITLES: Record<string, string> = {
  '/seller/shops': 'Магазины',
  '/seller/products': 'Товары',
  '/seller/orders': 'Заказы',
  '/seller/analytics': 'Аналитика',
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title
  }
  return 'Панель продавца'
}

/* shared glass style matching FloatingNav */
const glassPanel =
  'bg-nav-bg/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.18)]'

function SellerSidebar() {
  const { user } = useAuth()

  return (
    <aside
      className={cn(
        'fixed top-3 left-3 bottom-3 w-52 z-40 rounded-2xl flex flex-col overflow-hidden',
        glassPanel,
      )}
    >
      {/* Logo / back */}
      <div className="px-4 pt-5 pb-4 border-b border-white/8">
        <Link
          to="/"
          className="flex items-center gap-2 text-nav-text/80 hover:text-nav-text transition-colors"
        >
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold leading-none">Р</span>
          </div>
          <span className="font-bold text-[15px] tracking-tight">Районный</span>
        </Link>
        <p className="text-[11px] text-nav-text/40 mt-2 ml-9">Панель продавца</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-nav-text'
                  : 'text-nav-text/70 hover:bg-white/8 hover:text-nav-text',
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2.5 pb-4 pt-2 border-t border-white/8 space-y-0.5">
        {user && (
          <Link
            to={`/sellers/${user.id}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-nav-text/70 hover:text-nav-text hover:bg-white/8 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Мой профиль</span>
          </Link>
        )}
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-nav-text/70 hover:text-nav-text hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>На главную</span>
        </Link>
        <ThemeToggle
          showLabel
          className="rounded-xl hover:bg-white/5 text-nav-text/70 hover:text-nav-text"
          iconClassName="text-nav-text/50"
        />
      </div>
    </aside>
  )
}

function MobileHeader() {
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <header
      className={cn(
        'fixed top-3 left-3 right-3 z-40 h-11 rounded-2xl flex items-center px-4 gap-3 md:hidden',
        glassPanel,
      )}
    >
      <Link
        to="/"
        className="flex items-center gap-1.5 text-sm text-nav-text/65 hover:text-nav-text transition-colors shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-semibold">Районный</span>
      </Link>
      <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }} />
      <span className="text-sm font-semibold text-nav-text truncate flex-1">{title}</span>
      <ThemeToggle className="hover:bg-white/10" iconClassName="text-nav-text/60" />
    </header>
  )
}

function MobileBottomNav() {
  return (
    <nav
      className={cn(
        'fixed bottom-3 left-3 right-3 z-40 rounded-2xl flex md:hidden overflow-hidden',
        glassPanel,
      )}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors',
              isActive ? 'text-nav-text' : 'text-nav-text/45 hover:text-nav-text/80',
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                  isActive && 'bg-white/15',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] leading-tight font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SellerLayoutInner() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'color-mix(in srgb, var(--background) 75%, transparent)' }}
    >
      <LandscapeBackground />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SellerSidebar />
      </div>

      {/* Mobile floating header */}
      <MobileHeader />

      {/* Content */}
      <main className="md:ml-56 min-h-screen pt-17 md:pt-0 pb-22 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile floating bottom nav */}
      <MobileBottomNav />
    </div>
  )
}

export function SellerLayout() {
  return (
    <RequireSeller>
      <SellerLayoutInner />
    </RequireSeller>
  )
}
