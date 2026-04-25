import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <span className="text-primary-foreground text-xl font-bold">Р</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Войти в Районный</h1>
        <p className="text-muted-foreground text-sm mt-1">Покупайте у соседей</p>
      </div>

      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="Email"
          className="w-full h-11 px-4 rounded-xl border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/25 focus:border-primary/60 transition-all"
        />
        <input
          type="password"
          placeholder="Пароль"
          className="w-full h-11 px-4 rounded-xl border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/25 focus:border-primary/60 transition-all"
        />
        <ShimmerButton type="submit" className="w-full h-11 text-sm font-semibold">
          Войти
        </ShimmerButton>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Нет аккаунта?{' '}
        <Link to="/" className="text-primary hover:underline font-medium">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
