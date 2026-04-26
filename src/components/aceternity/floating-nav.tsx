import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Heart, ShoppingCart, MapPin, User, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/cart-context'
import { useFavorites } from '@/contexts/favorites-context'
import { useUserLocation } from '@/contexts/location-context'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LocationPicker } from '@/components/location/location-picker'
import { SearchBar } from '@/components/nav/search-bar'
import { useTheme } from '@/contexts/theme-context'
import { Sun, Moon, Monitor } from 'lucide-react'

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const
const THEME_LABELS = { light: 'Светлая', dark: 'Тёмная', system: 'Системная' } as const

export function FloatingNav() {
  const { totalItems } = useCart()
  const { totalFavorites } = useFavorites()
  const { location } = useUserLocation()
  const { theme, setTheme } = useTheme()
  const ThemeIcon = THEME_ICONS[theme] ?? Monitor
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 768)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 80)
  })

  useEffect(() => {
    const handler = () => setIsWide(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const iconBtn =
    'w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer'

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <motion.nav
          animate={{
            width: scrolled ? (isWide ? '65%' : '92%') : '100%',
            y: scrolled ? 14 : 0,
            borderRadius: scrolled ? 24 : 0,
            boxShadow: scrolled
              ? '0 8px 32px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.05)'
              : 'none',
            paddingLeft: scrolled ? 20 : 16,
            paddingRight: scrolled ? 20 : 16,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            minWidth: 0,
            borderBottom: scrolled
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(255,255,255,0.08)',
          }}
          className="mx-auto h-14 relative flex items-center gap-2 md:gap-3 bg-nav-bg/60 backdrop-blur-xl"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-primary-foreground text-sm font-bold leading-none">Р</span>
            </div>
            <AnimatePresence initial={false}>
              {!scrolled && (
                <motion.span
                  key="logo-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-bold text-nav-text text-[17px] hidden sm:block tracking-tight overflow-hidden whitespace-nowrap"
                >
                  Районный
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Location — desktop only */}
          <div className="hidden md:block relative group/loc shrink-0">
            <motion.button
              onClick={() => setPickerOpen(true)}
              animate={{
                paddingLeft: scrolled ? 8 : 12,
                paddingRight: scrolled ? 8 : 12,
                paddingTop: scrolled ? 8 : 6,
                paddingBottom: scrolled ? 8 : 6,
                borderRadius: scrolled ? 12 : 9999,
                backgroundColor: scrolled ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.1)',
                boxShadow: scrolled ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.15)',
              }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <MapPin
                className={`w-5 h-5 shrink-0 ${location ? 'text-accent' : 'text-nav-text/70'}`}
              />
              <AnimatePresence initial={false}>
                {!scrolled && (
                  <motion.span
                    key="loc-label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm text-nav-text/80 overflow-hidden whitespace-nowrap"
                  >
                    {location ? 'Район выбран' : 'Выбрать район'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {location && (
              <div className="absolute top-full left-0 mt-2 z-50 px-3 py-2 rounded-xl bg-foreground text-background text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/loc:opacity-100 transition-opacity duration-150 shadow-lg">
                <p className="font-medium">{location.label}</p>
                <p className="text-background/60 mt-0.5">
                  {location.radius < 1
                    ? `${Math.round(location.radius * 1000)} м`
                    : `${location.radius} км`}
                </p>
              </div>
            )}
          </div>

          {/* Search — absolutely centred relative to the full nav width */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-[min(480px,38%)]">
            <SearchBar />
          </div>

          {/* Flex spacer to push actions to the right */}
          <div className="hidden md:block flex-1" />

          {/* Desktop action icons */}
          <div className="hidden md:flex items-center gap-0.5 shrink-0">
            <Link to="/favorites" aria-label="Избранное" className={`relative ${iconBtn}`}>
              <Heart className="w-5 h-5 text-nav-text/70" />
              {totalFavorites > 0 && (
                <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalFavorites > 9 ? '9+' : totalFavorites}
                </span>
              )}
            </Link>
            <Link to="/cart" aria-label="Корзина" className={`relative ${iconBtn}`}>
              <ShoppingCart className="w-5 h-5 text-nav-text/70" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-accent text-nav-bg text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
            <Link to="/login" aria-label="Профиль" className={iconBtn}>
              <User className="w-5 h-5 text-nav-text/70" />
            </Link>
            <ThemeToggle className="hover:bg-white/10" iconClassName="text-nav-text/70" />
          </div>

          {/* Mobile: spacer + burger only */}
          <div className="flex-1 md:hidden" />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Меню"
            className={`md:hidden ${iconBtn}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5 text-nav-text/80" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5 text-nav-text/80" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{
                opacity: 1,
                y: 0,
                marginTop: scrolled ? 16 : 4,
                width: scrolled ? '92%' : 'calc(100% - 16px)',
                marginLeft: scrolled ? 'auto' : 8,
                marginRight: scrolled ? 'auto' : 8,
              }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="md:hidden rounded-2xl border border-white/10 bg-nav-bg/60 backdrop-blur-xl shadow-2xl"
            >
              <div className="px-4 py-3 border-b border-white/8">
                <SearchBar onNavigate={() => setMenuOpen(false)} />
              </div>

              <div className="overflow-hidden rounded-b-2xl">
                {/* Location row */}
                <button
                  onClick={() => {
                    setPickerOpen(true)
                    setMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-nav-text/80 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/8"
                >
                  <MapPin
                    className={`w-5 h-5 shrink-0 ${location ? 'text-accent' : 'text-nav-text/50'}`}
                  />
                  <span className="flex-1 text-left">
                    {location ? location.label : 'Выбрать район'}
                  </span>
                  {location && (
                    <span className="text-xs text-nav-text/40">
                      {location.radius < 1
                        ? `${Math.round(location.radius * 1000)} м`
                        : `${location.radius} км`}
                    </span>
                  )}
                </button>

                <div className="flex flex-col py-1">
                  <Link
                    to="/favorites"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-nav-text/80 hover:bg-white/5 transition-colors"
                  >
                    <div className="relative w-5 h-5 shrink-0">
                      <Heart className="w-5 h-5 text-nav-text/70" />
                      {totalFavorites > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                          {totalFavorites > 9 ? '9+' : totalFavorites}
                        </span>
                      )}
                    </div>
                    <span className="text-sm">Избранное</span>
                  </Link>

                  <Link
                    to="/cart"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-nav-text/80 hover:bg-white/5 transition-colors"
                  >
                    <div className="relative w-5 h-5 shrink-0">
                      <ShoppingCart className="w-5 h-5 text-nav-text/70" />
                      {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 bg-accent text-nav-bg text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                          {totalItems > 9 ? '9+' : totalItems}
                        </span>
                      )}
                    </div>
                    <span className="text-sm">Корзина</span>
                  </Link>

                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-nav-text/80 hover:bg-white/5 transition-colors"
                  >
                    <User className="w-5 h-5 text-nav-text/70 shrink-0" />
                    <span className="text-sm">Профиль</span>
                  </Link>

                  <button
                    onClick={() => {
                      const themes = ['light', 'dark', 'system'] as const
                      setTheme(themes[(themes.indexOf(theme) + 1) % themes.length])
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-nav-text/80 hover:bg-white/5 transition-colors cursor-pointer w-full"
                  >
                    <ThemeIcon className="w-5 h-5 text-nav-text/70 shrink-0" />
                    <span className="text-sm">Тема: {THEME_LABELS[theme]}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
