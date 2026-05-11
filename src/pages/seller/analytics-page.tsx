import { BarChart2 } from 'lucide-react'
import { SalesSection } from '@/components/seller/analytics/sales-section'
import { TopProductsSection } from '@/components/seller/analytics/top-products-section'
import { RatingSection } from '@/components/seller/analytics/rating-section'
import { ProductRatingsSection } from '@/components/seller/analytics/product-ratings-section'
import { StockAlertsSection } from '@/components/seller/analytics/stock-alerts-section'
import { SellerReviewsSection } from '@/components/seller/analytics/seller-reviews-section'

export function AnalyticsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Аналитика</h1>
      </div>
      <SalesSection />
      <TopProductsSection />
      <RatingSection />
      <SellerReviewsSection />
      <ProductRatingsSection />
      <StockAlertsSection />
    </div>
  )
}
