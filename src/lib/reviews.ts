import { ReviewsService } from '@/api/reviews'
import type { ReviewSummaryDto } from '@/api/reviews'
import type { RatingAggregate, ReviewItem } from '@/types/product-detail'

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

export async function fetchProductRating(productId: string): Promise<RatingAggregate> {
  const dto = await ReviewsService.getApiReviewsReviewsRating({
    subjectType: 'Product',
    subjectId: productId,
  })
  return {
    averageRating: dto.averageRating ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    oneStar: dto.oneStar ?? 0,
    twoStar: dto.twoStar ?? 0,
    threeStar: dto.threeStar ?? 0,
    fourStar: dto.fourStar ?? 0,
    fiveStar: dto.fiveStar ?? 0,
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
