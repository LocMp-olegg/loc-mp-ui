import { AnimatePresence, motion } from 'framer-motion'
import { X, LogIn, UserPlus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface AuthPromptModalProps {
  open: boolean
  onClose: () => void
}

export function AuthPromptModal({ open, onClose }: AuthPromptModalProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const goTo = (tab: 'login' | 'register') => {
    sessionStorage.setItem('auth-tab', tab)
    navigate('/login', { state: { from: location } })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed z-[81] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4"
          >
            <div className="dark rounded-2xl bg-nav-bg/90 backdrop-blur-xl border border-white/10 shadow-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-nav-text font-semibold text-base">Войдите в аккаунт</h2>
                  <p className="text-nav-text/55 text-sm mt-1">
                    Это действие доступно только авторизованным пользователям
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-nav-text/45 hover:text-nav-text transition-colors cursor-pointer p-1 -mt-1 -mr-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => goTo('login')}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/80 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => goTo('register')}
                  className="w-full h-11 rounded-xl border border-white/15 text-nav-text/80 hover:text-nav-text hover:border-white/25 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Зарегистрироваться
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
