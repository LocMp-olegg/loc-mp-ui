import { ReviewsService } from '@/api/reviews'
import type { ReviewSummaryDto } from '@/api/reviews'
import type { ReviewItem } from '@/types/product-detail'

function mapReview(dto: ReviewSummaryDto): ReviewItem {
  return {
    id: dto.id ?? '',
    reviewerName: dto.reviewerName ?? 'Аноним',
    rating: dto.rating ?? 0,
    comment: dto.comment ?? null,
    createdAt: dto.createdAt ?? '',
    photos: (dto.photos ?? []).map((p) => p.storageUrl ?? '').filter(Boolean),
    response: dto.response
      ? { comment: dto.response.comment ?? '', createdAt: dto.response.createdAt ?? '' }
      : null,
  }
}

export async function fetchProductReviews(productId: string): Promise<ReviewItem[]> {
  const result = await ReviewsService.getApiReviewsReviews({
    subjectType: 'Product',
    subjectId: productId,
    pageSize: 50,
  })
  return (result.items ?? [])
    .filter((r) => r.isVisible !== false)
    .map(mapReview)
}
