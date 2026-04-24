import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getCategoryById } from '@/data/mock-products'
import { ProductCard } from '@/components/product/product-card'

export function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  const category = id !== undefined ? getCategoryById(id) : undefined

  if (category === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Категория не найдена</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">{category.emoji}</span>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">{category.name}</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {category.products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-full" />
        ))}
      </div>
    </div>
  )
}
