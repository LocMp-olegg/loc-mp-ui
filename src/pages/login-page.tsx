import { useState, useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'

type Tab = 'login' | 'register'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

function TabSwitcher({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex p-1 rounded-xl bg-white/6 border border-white/10">
      {(['login', 'register'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            tab === t ? 'bg-white/14 text-nav-text shadow-sm' : 'text-nav-text hover:text-nav-text'
          }`}
        >
          {t === 'login' ? 'Войти' : 'Регистрация'}
        </button>
      ))}
    </div>
  )
}

export function LoginPage() {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
  const [tab, setTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('auth-tab')
    return saved === 'register' ? 'register' : 'login'
  })
  const isDesktop = useIsDesktop()

  if (initializing) return null
  if (isAuthenticated) return <Navigate to={from} replace />

  const handleSetTab = (t: Tab) => {
    sessionStorage.setItem('auth-tab', t)
    setTab(t)
  }

  const formContent = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tab}
        initial={{ opacity: 0, x: tab === 'login' ? -12 : 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: tab === 'login' ? 12 : -12 }}
        transition={{ duration: 0.18 }}
      >
        {tab === 'login' ? (
          <LoginForm onSwitch={() => handleSetTab('register')} />
        ) : (
          <RegisterForm onSwitch={() => handleSetTab('login')} />
        )}
      </motion.div>
    </AnimatePresence>
  )

  // ── Mobile: centered glass card over landscape ─────────────────────────────
  if (!isDesktop) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center justify-center">
        <div className="dark w-full max-w-100 rounded-2xl bg-nav-bg/75 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/"
                className="flex items-center gap-1 text-sm text-nav-text/90 hover:text-nav-text transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                На главную
              </Link>
              <ThemeToggle className="hover:bg-white/10" iconClassName="text-nav-text/90" />
            </div>
          </div>
          <div className="px-6 pb-6">
            <TabSwitcher tab={tab} setTab={handleSetTab} />
            <div className="mt-4">{formContent}</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Desktop: two-column with scrollable glass panel ────────────────────────
  return (
    <div className="min-h-screen flex">
      <div className="flex-1" />
      <div className="dark w-135 shrink-0 min-h-screen flex flex-col bg-nav-bg/75 backdrop-blur-xl border-l border-white/10">
        {/* Fixed header */}
        <div className="shrink-0 px-8 pt-5 pb-4">
          <div className="flex items-center justify-between mb-5">
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-nav-text/90 hover:text-nav-text transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              На главную
            </Link>
            <ThemeToggle className="hover:bg-white/10" iconClassName="text-nav-text/90" />
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto flex flex-col scrollbar-thin">
          <div className="my-auto w-full px-8 py-6">
            <TabSwitcher tab={tab} setTab={handleSetTab} />
            <div className="mt-4">{formContent}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
