import { Clock, FolderOpen, Store, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pluralize } from '@/lib/utils'
import type { ProductDetail } from '@/types/product-detail'

interface Props {
  product: ProductDetail
  categoryName: string | null
}

export function ProductInfo({ product, categoryName }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Name */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
        {product.name}
      </h1>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {categoryName && (
          <div className="flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <Link
              to={`/category/${product.categoryId}`}
              className="hover:text-primary transition-colors"
            >
              {categoryName}
            </Link>
          </div>
        )}

        <Link
          to={`/shop/${product.shopId}`}
          className="flex items-center gap-1.5 hover:text-primary transition-colors"
        >
          <Store className="w-3.5 h-3.5 shrink-0" />
          <span>{product.shopName}</span>
        </Link>
      </div>

      {/* Made to order + lead time */}
      {product.isMadeToOrder && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Wrench className="w-3.5 h-3.5" />
            Сделано на заказ
          </span>
          {product.leadTimeDays !== null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Время изготовления: {product.leadTimeDays}{' '}
              {pluralize(product.leadTimeDays, 'день', 'дня', 'дней')}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="rounded-2xl bg-muted/50 border border-border p-4">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}
    </div>
  )
}
