import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getProductById } from '@/data/mock-products'

export function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const product = id !== undefined ? getProductById(id) : undefined

  if (product === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Товар не найден</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">{product.name}</h1>
      <p className="text-muted-foreground text-sm mb-4">{product.shopName}</p>
      <div className="flex flex-wrap gap-3">
        {product.images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${product.name} — фото ${i + 1}`}
            className="w-48 h-48 object-cover rounded-2xl bg-muted"
          />
        ))}
      </div>
      <p className="text-3xl font-bold text-foreground mt-6">
        {product.price.toLocaleString('ru-RU')} ₽
        <span className="text-base font-normal text-muted-foreground ml-2">/ {product.unit}</span>
      </p>
    </div>
  )
}
