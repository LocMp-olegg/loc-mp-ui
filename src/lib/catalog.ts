import noImageUrl from '@/assets/no-image-available.jpg'
import { CategoriesService, ProductsService, ShopsService, SellersService } from '@/api/catalog'
import type {
  ProductDto,
  ProductSummaryDto,
  CategoryTreeDto,
  ShopDto,
  ProductSortBy,
} from '@/api/catalog'
import type { Product } from '@/types/product'
import type { ProductDetail } from '@/types/product-detail'
import type { ShopDetail } from '@/types/shop'

const EMOJI_MAP: [string, string][] = [
  ['выпечк', '🥐'],
  ['десерт', '🍰'],
  ['хлеб', '🍞'],
  ['овощ', '🥦'],
  ['фрукт', '🍎'],
  ['ягод', '🍓'],
  ['еда', '🍽️'],
  ['напит', '🥤'],
  ['мясо', '🥩'],
  ['рыба', '🐟'],
  ['молоко', '🥛'],
  ['сыр', '🧀'],
  ['хендмейд', '🎨'],
  ['ручн', '🎨'],
  ['украшени', '💍'],
  ['одежд', '👗'],
  ['аксессуар', '👜'],
  ['растени', '🌿'],
  ['цветы', '🌸'],
  ['цветок', '🌸'],
  ['услуг', '🛎️'],
  ['электроник', '📱'],
  ['книг', '📚'],
]

export function resolveEmoji(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, emoji] of EMOJI_MAP) {
    if (lower.includes(key)) return emoji
  }
  return '📦'
}

function flattenLeaves(nodes: CategoryTreeDto[]): CategoryTreeDto[] {
  const result: CategoryTreeDto[] = []
  for (const node of nodes) {
    const children = (node.children ?? []).filter((c) => c.isActive !== false && c.id)
    if (children.length === 0) {
      result.push(node)
    } else {
      result.push(...flattenLeaves(children))
    }
  }
  return result
}

function buildLeafToRoot(tree: CategoryTreeDto[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const root of tree) {
    const rootId = root.id ?? ''
    if (!root.children?.length && rootId) map.set(rootId, rootId)
    const queue = [...(root.children ?? [])]
    while (queue.length > 0) {
      const node = queue.shift()!
      if (node.id) map.set(node.id, rootId)
      queue.push(...(node.children ?? []))
    }
  }
  return map
}

function mapImages(dto: ProductSummaryDto): string[] {
  const urls = (dto.photoUrls ?? []).filter((u): u is string => Boolean(u))
  if (urls.length > 0) return urls
  if (dto.mainPhotoUrl) return [dto.mainPhotoUrl]
  return [noImageUrl]
}

export function mapProduct(dto: ProductSummaryDto): Product {
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    price: dto.price ?? 0,
    unit: dto.unit ?? 'шт',
    shopId: dto.shopId ?? '',
    shopName: dto.shopName ?? '',
    categoryId: dto.categoryId ?? '',
    images: mapImages(dto),
    rating: dto.averageRating ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    isAvailable:
      (dto.isActive ?? false) && ((dto.stockQuantity ?? 0) > 0 || (dto.isMadeToOrder ?? false)),
    stockQuantity: dto.stockQuantity ?? 0,
    isMadeToOrder: dto.isMadeToOrder ?? false,
    location: '',
  }
}

export interface RootCategory {
  id: string
  name: string
  emoji: string
}

export interface LeafCategory {
  id: string
  name: string
  emoji: string
  rootCategoryId: string
}

export interface CatalogStructure {
  rootCategories: RootCategory[]
  leafCategories: LeafCategory[]
}

/** Fast: fetches only the category tree — no products. */
export async function fetchCatalogStructure(): Promise<CatalogStructure> {
  const tree = await CategoriesService.getApiCatalogCategoriesTree()
  const activeRoots = tree.filter((c) => c.isActive !== false && c.id)
  const leaves = flattenLeaves(activeRoots)
  const leafToRoot = buildLeafToRoot(activeRoots)

  return {
    rootCategories: activeRoots.map((r) => ({
      id: r.id ?? '',
      name: r.name ?? '',
      emoji: resolveEmoji(r.name ?? ''),
    })),
    leafCategories: leaves.map((l) => ({
      id: l.id ?? '',
      name: l.name ?? '',
      emoji: resolveEmoji(l.name ?? ''),
      rootCategoryId: leafToRoot.get(l.id ?? '') ?? l.id ?? '',
    })),
  }
}

export interface ProductFilter {
  sort?: ProductSortBy
  minPrice?: number
  maxPrice?: number
  isInStock?: boolean
}

export interface GeoFilter {
  lat: number
  lng: number
  radiusKm: number
}

/** Lazy: fetches products for a single category on demand. Uses /nearby when geo is provided. */
export async function fetchCategoryProducts(
  categoryId: string,
  geo?: GeoFilter,
  filter: ProductFilter = {},
  pageSize = 10,
): Promise<Product[]> {
  const { sort, minPrice, maxPrice, isInStock } = filter
  if (geo) {
    const result = await ProductsService.getApiCatalogProductsNearby({
      categoryId,
      lat: geo.lat,
      lon: geo.lng,
      radiusKm: geo.radiusKm,
      minPrice,
      maxPrice,
      isInStock,
      pageSize,
    })
    return (result.items ?? []).map(mapProduct)
  }
  const result = await ProductsService.getApiCatalogProductsSearch({
    categoryId,
    sort,
    minPrice,
    maxPrice,
    isInStock,
    pageSize,
  })
  return (result.items ?? []).map(mapProduct)
}

export async function fetchSearchSuggestions(query: string): Promise<Product[]> {
  const result = await ProductsService.getApiCatalogProductsSearch({ search: query, pageSize: 5 })
  return (result.items ?? []).map(mapProduct)
}

export async function fetchSearchResults(
  query: string,
  page = 1,
  filter: ProductFilter = {},
): Promise<{ products: Product[]; hasNextPage: boolean }> {
  const { sort, minPrice, maxPrice, isInStock } = filter
  const result = await ProductsService.getApiCatalogProductsSearch({
    search: query,
    pageSize: 20,
    page,
    sort,
    minPrice,
    maxPrice,
    isInStock,
  })
  return {
    products: (result.items ?? []).map(mapProduct),
    hasNextPage: result.hasNextPage ?? false,
  }
}

export function mapProductDetail(dto: ProductDto): ProductDetail {
  const photos = (dto.photos ?? [])
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((p) => p.storageUrl ?? '')
    .filter(Boolean)
  const images = photos.length > 0 ? photos : dto.mainPhotoUrl ? [dto.mainPhotoUrl] : [noImageUrl]

  const stockQuantity = dto.stockQuantity ?? 0
  const isMadeToOrder = dto.isMadeToOrder ?? false

  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    description: dto.description ?? null,
    price: dto.price ?? 0,
    unit: dto.unit ?? 'шт',
    shopId: dto.shopId ?? '',
    shopName: dto.shopName ?? '',
    sellerName: dto.sellerName ?? null,
    categoryId: dto.categoryId ?? '',
    images,
    rating: dto.averageRating ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    isAvailable: (dto.isActive ?? false) && (stockQuantity > 0 || isMadeToOrder),
    stockQuantity,
    isMadeToOrder,
    leadTimeDays: dto.leadTimeDays ?? null,
    tags: (dto.tags ?? []).filter(Boolean) as string[],
    location: '',
  }
}

function mapShopDetail(dto: ShopDto): ShopDetail {
  const photos = (dto.photos ?? [])
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((p) => p.storageUrl ?? '')
    .filter(Boolean)
  return {
    id: dto.id ?? '',
    sellerId: dto.sellerId ?? '',
    name: dto.businessName ?? '',
    sellerDisplayName: null,
    description: dto.description ?? null,
    avatarUrl: dto.avatarUrl ?? null,
    businessType: dto.businessType ?? null,
    workingHours: dto.workingHours ?? null,
    serviceRadiusKm: dto.serviceRadiusMeters
      ? Math.round(dto.serviceRadiusMeters / 100) / 10
      : null,
    allowCourierDelivery: dto.allowCourierDelivery ?? false,
    isVerified: dto.isVerified ?? false,
    photos,
  }
}

export async function fetchShopDetail(shopId: string): Promise<ShopDetail> {
  const dto = await ShopsService.getApiCatalogShops({ id: shopId })
  const base = mapShopDetail(dto)
  const sellerDto = await SellersService.getApiCatalogSellers({ id: base.sellerId }).catch(
    () => null,
  )
  return { ...base, sellerDisplayName: sellerDto?.displayName ?? null }
}

export interface ShopProductFilter {
  categoryId?: string
  rootCategoryId?: string
  minPrice?: number
  maxPrice?: number
  isInStock?: boolean
  sort?: import('@/api/catalog').ProductSortBy
  search?: string
}

export async function fetchShopProducts(
  shopId: string,
  page = 1,
  pageSize = 20,
  filter: ShopProductFilter = {},
): Promise<{ products: Product[]; hasNextPage: boolean }> {
  const result = await ProductsService.getApiCatalogProductsByShop({
    shopId,
    page,
    pageSize,
    ...filter,
  })
  return {
    products: (result.items ?? []).map(mapProduct),
    hasNextPage: result.hasNextPage ?? false,
  }
}

export async function fetchProductDetail(id: string): Promise<ProductDetail> {
  const dto = await ProductsService.getApiCatalogProducts({ id })
  return mapProductDetail(dto)
}

/** Category page: full product list + category info. */
export async function fetchCategoryById(
  categoryId: string,
  page = 1,
  pageSize = 20,
  filter: ProductFilter = {},
): Promise<{ id: string; name: string; emoji: string; products: Product[]; hasNextPage: boolean }> {
  const { sort, minPrice, maxPrice, isInStock } = filter
  const [catDto, productsResult] = await Promise.all([
    CategoriesService.getApiCatalogCategories({ id: categoryId }),
    ProductsService.getApiCatalogProductsSearch({
      categoryId,
      page,
      pageSize,
      sort,
      minPrice,
      maxPrice,
      isInStock,
    }),
  ])

  return {
    id: catDto.id ?? '',
    name: catDto.name ?? '',
    emoji: resolveEmoji(catDto.name ?? ''),
    products: (productsResult.items ?? []).map(mapProduct),
    hasNextPage: productsResult.hasNextPage ?? false,
  }
}
