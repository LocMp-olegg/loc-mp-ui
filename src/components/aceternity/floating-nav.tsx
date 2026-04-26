import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Heart, ShoppingCart, MapPin, Search, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/cart-context'
import { useFavorites } from '@/contexts/favorites-context'
import { useUserLocation } from '@/contexts/location-context'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LocationPicker } from '@/components/location/location-picker'

export function FloatingNav() {
  const { totalItems } = useCart()
  const { totalFavorites } = useFavorites()
  const { location } = useUserLocation()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 768)
  const [pickerOpen, setPickerOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 80)
  })

  useEffect(() => {
    const handler = () => setIsWide(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

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
          className="mx-auto h-14 flex items-center gap-2 md:gap-3 bg-nav-bg/60 backdrop-blur-xl"
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

          {/* Location button — always on the left, changes shape on scroll */}
          <div className="hidden md:block relative group/loc">
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

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Location — mobile only (desktop handled on the left) */}
            <button
              onClick={() => setPickerOpen(true)}
              aria-label="Район"
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MapPin className={`w-5 h-5 ${location ? 'text-accent' : 'text-nav-text/70'}`} />
            </button>

            <button
              aria-label="Поиск"
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5 text-nav-text/70" />
            </button>

            <Link
              to="/favorites"
              aria-label="Избранное"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Heart className="w-5 h-5 text-nav-text/70" />
              {totalFavorites > 0 && (
                <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalFavorites > 9 ? '9+' : totalFavorites}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              aria-label="Корзина"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-nav-text/70" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-accent text-nav-bg text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            <Link
              to="/login"
              aria-label="Профиль"
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <User className="w-5 h-5 text-nav-text/70" />
            </Link>

            <ThemeToggle className="hover:bg-white/10" iconClassName="text-nav-text/70" />
          </div>
        </motion.nav>
      </div>

      <AnimatePresence>
        {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
