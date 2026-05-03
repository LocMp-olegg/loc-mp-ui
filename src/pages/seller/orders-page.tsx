import { ShoppingBag } from 'lucide-react'

export function OrdersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Заказы</h1>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-12 text-center">
        <p className="text-muted-foreground text-sm">Скоро здесь появятся входящие заказы</p>
      </div>
    </div>
  )
}
