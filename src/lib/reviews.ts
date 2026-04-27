import { ReviewsService } from '@/api/reviews'
import type { RatingAggregateDto, ReviewSortBy, ReviewSummaryDto } from '@/api/reviews'
import type { ReviewItem } from '@/types/product-detail'

const REVIEWS_PAGE_SIZE = 10

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

export function fetchSellerRating(sellerId: string): Promise<RatingAggregateDto> {
  return ReviewsService.getApiReviewsReviewsRating({
    subjectType: 'Seller',
    subjectId: sellerId,
  })
}

export async function fetchSellerReviews(
  sellerId: string,
  sortBy?: ReviewSortBy,
  rating?: number,
  page = 1,
): Promise<{ items: ReviewItem[]; hasNextPage: boolean }> {
  const result = await ReviewsService.getApiReviewsReviews({
    subjectType: 'Seller',
    subjectId: sellerId,
    page,
    pageSize: REVIEWS_PAGE_SIZE,
    sortBy,
    rating,
  })
  return {
    items: (result.items ?? []).filter((r) => r.isVisible !== false).map(mapReview),
    hasNextPage: result.hasNextPage ?? false,
  }
}

export function fetchProductRating(productId: string): Promise<RatingAggregateDto> {
  return ReviewsService.getApiReviewsReviewsRating({
    subjectType: 'Product',
    subjectId: productId,
  })
}

export async function fetchProductReviews(
  productId: string,
  sortBy?: ReviewSortBy,
  rating?: number,
  page = 1,
): Promise<{ items: ReviewItem[]; hasNextPage: boolean }> {
  const result = await ReviewsService.getApiReviewsReviews({
    subjectType: 'Product',
    subjectId: productId,
    page,
    pageSize: REVIEWS_PAGE_SIZE,
    sortBy,
    rating,
  })
  return {
    items: (result.items ?? []).filter((r) => r.isVisible !== false).map(mapReview),
    hasNextPage: result.hasNextPage ?? false,
  }
}
