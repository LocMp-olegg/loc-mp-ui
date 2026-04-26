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

          {/* Location button */}
          <AnimatePresence initial={false}>
            {!scrolled && (
              <motion.button
                key="location"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setPickerOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm text-nav-text/80 hover:bg-white/15 hover:text-nav-text transition-colors shrink-0 cursor-pointer overflow-hidden whitespace-nowrap max-w-[180px]"
              >
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">
                  {location
                    ? `${location.label} · ${location.radius < 1 ? `${Math.round(location.radius * 1000)} м` : `${location.radius} км`}`
                    : 'Выбрать район'}
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Location — mobile only */}
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
