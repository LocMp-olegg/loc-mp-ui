import noImageUrl from '@/assets/no-image-available.jpg'
import {
  CategoriesService,
  ProductsService,
  ShopsService,
  SellersService,
  TagsService,
} from '@/api/catalog'
import type {
  ProductDto,
  ProductSummaryDto,
  CategoryTreeDto,
  ShopDto,
  SellerDto,
  ProductSortBy,
  TagDto,
} from '@/api/catalog'
import type { Product } from '@/types/product'
import type { ProductDetail } from '@/types/product-detail'
import type { ShopDetail } from '@/types/shop'
import type { LucideIcon } from 'lucide-react'
import {
  Croissant,
  CakeSlice,
  Wheat,
  Leaf,
  Apple,
  Cherry,
  UtensilsCrossed,
  Coffee,
  Beef,
  Fish,
  Milk,
  Palette,
  Gem,
  Shirt,
  ShoppingBag,
  Flower2,
  Wrench,
  Smartphone,
  BookOpen,
  Package,
} from 'lucide-react'

const ICON_MAP: [string, LucideIcon][] = [
  ['выпечк', Croissant],
  ['десерт', CakeSlice],
  ['хлеб', Wheat],
  ['овощ', Leaf],
  ['фрукт', Apple],
  ['ягод', Cherry],
  ['еда', UtensilsCrossed],
  ['напит', Coffee],
  ['мясо', Beef],
  ['рыба', Fish],
  ['молоко', Milk],
  ['сыр', Milk],
  ['хендмейд', Palette],
  ['ручн', Palette],
  ['украшени', Gem],
  ['одежд', Shirt],
  ['аксессуар', ShoppingBag],
  ['растени', Leaf],
  ['цветы', Flower2],
  ['цветок', Flower2],
  ['услуг', Wrench],
  ['электроник', Smartphone],
  ['книг', BookOpen],
]

export function resolveIcon(name: string): LucideIcon {
  const lower = name.toLowerCase()
  for (const [key, icon] of ICON_MAP) {
    if (lower.includes(key)) return icon
  }
  return Package
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

export function isProductOrderable(
  product: Pick<Product, 'isAvailable' | 'shopIsActive'>,
): boolean {
  return product.isAvailable && product.shopIsActive
}

export function mapProduct(dto: ProductSummaryDto): Product {
  const isActive = dto.isActive ?? false
  const shopIsActive = dto.shopIsActive ?? true
  const stockQuantity = dto.stockQuantity ?? 0
  const isMadeToOrder = dto.isMadeToOrder ?? false
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
    isActive,
    shopIsActive,
    isAvailable: isActive && (stockQuantity > 0 || isMadeToOrder),
    stockQuantity,
    isMadeToOrder,
    location: '',
    tags: (dto.tags ?? []).filter(Boolean) as string[],
  }
}

export function mapProductFromDto(dto: ProductDto): Product {
  const sorted = [...(dto.photos ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const images =
    sorted.length > 0
      ? sorted.map((p) => p.storageUrl ?? '').filter(Boolean)
      : dto.mainPhotoUrl
        ? [dto.mainPhotoUrl]
        : [noImageUrl]

  const isActive = dto.isActive ?? false
  const shopIsActive = dto.shopIsActive ?? true
  const stockQuantity = dto.stockQuantity ?? 0
  const isMadeToOrder = dto.isMadeToOrder ?? false
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    price: dto.price ?? 0,
    unit: dto.unit ?? 'шт',
    shopId: dto.shopId ?? '',
    shopName: dto.shopName ?? '',
    categoryId: dto.categoryId ?? '',
    images,
    rating: dto.averageRating ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    isActive,
    shopIsActive,
    isAvailable: isActive && (stockQuantity > 0 || isMadeToOrder),
    stockQuantity,
    isMadeToOrder,
    location: '',
    tags: (dto.tags ?? []).filter(Boolean) as string[],
  }
}

export interface RootCategory {
  id: string
  name: string
  icon: LucideIcon
}

export interface LeafCategory {
  id: string
  name: string
  icon: LucideIcon
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
      icon: resolveIcon(r.name ?? ''),
    })),
    leafCategories: leaves.map((l) => ({
      id: l.id ?? '',
      name: l.name ?? '',
      icon: resolveIcon(l.name ?? ''),
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

export async function fetchSearchSuggestions(query: string, geo?: GeoFilter): Promise<Product[]> {
  const result = geo
    ? await ProductsService.getApiCatalogProductsNearby({
        search: query,
        lat: geo.lat,
        lon: geo.lng,
        radiusKm: geo.radiusKm,
        pageSize: 5,
      })
    : await ProductsService.getApiCatalogProductsSearch({ search: query, pageSize: 5 })
  return (result.items ?? []).map(mapProduct)
}

export async function fetchSearchResults(
  query: string,
  page = 1,
  filter: ProductFilter = {},
  geo?: GeoFilter,
): Promise<{ products: Product[]; hasNextPage: boolean }> {
  const { sort, minPrice, maxPrice, isInStock } = filter
  const result = geo
    ? await ProductsService.getApiCatalogProductsNearby({
        search: query || undefined,
        lat: geo.lat,
        lon: geo.lng,
        radiusKm: geo.radiusKm,
        minPrice,
        maxPrice,
        isInStock,
        page,
        pageSize: 20,
      })
    : await ProductsService.getApiCatalogProductsSearch({
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

  const isActive = dto.isActive ?? false
  const shopIsActive = dto.shopIsActive ?? true
  const stockQuantity = dto.stockQuantity ?? 0
  const isMadeToOrder = dto.isMadeToOrder ?? false

  return {
    id: dto.id ?? '',
    sellerId: dto.sellerId ?? '',
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
    isActive,
    shopIsActive,
    isAvailable: isActive && (stockQuantity > 0 || isMadeToOrder),
    stockQuantity,
    isMadeToOrder,
    leadTimeDays: dto.leadTimeDays ?? null,
    tags: (dto.tags ?? []).filter(Boolean) as string[],
    location: '',
  }
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return digits.slice(1)
  }
  return digits.length === 10 ? digits : null
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
    phone: normalizePhone(dto.phoneNumber),
    email: dto.email ?? null,
    inn: dto.inn ?? null,
    createdAt: dto.createdAt ?? null,
    address: dto.address
      ? {
          city: dto.address.city ?? null,
          street: dto.address.street ?? null,
          houseNumber: dto.address.houseNumber ?? null,
          apartment: dto.address.apartment ?? null,
          entrance: dto.address.entrance ?? null,
          floor: dto.address.floor ?? null,
        }
      : null,
    latitude: dto.latitude ?? null,
    longitude: dto.longitude ?? null,
    averageRating: dto.averageRating ?? null,
    reviewCount: dto.reviewCount ?? 0,
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

export async function fetchSellerWithShops(
  sellerId: string,
): Promise<{ seller: SellerDto; shops: ShopDto[] }> {
  const [seller, shops] = await Promise.all([
    SellersService.getApiCatalogSellers({ id: sellerId }),
    ShopsService.getApiCatalogShopsBySeller({ sellerId }),
  ])
  return { seller, shops }
}

export async function fetchProductDetail(id: string): Promise<ProductDetail> {
  const dto = await ProductsService.getApiCatalogProducts({ id })
  return mapProductDetail(dto)
}

let _tagsCache: TagDto[] | null = null

async function loadAllTags(): Promise<TagDto[]> {
  if (!_tagsCache) {
    _tagsCache = await TagsService.getApiCatalogTags()
  }
  return _tagsCache
}

export async function fetchTagSuggestions(query: string): Promise<TagDto[]> {
  const tags = await loadAllTags()
  const lower = query.toLowerCase()
  return tags
    .filter((t) => t.name?.toLowerCase().includes(lower) || t.slug?.toLowerCase().includes(lower))
    .slice(0, 8)
}

export async function fetchTagResults(
  tag: string,
  page = 1,
  filter: ProductFilter = {},
  geo?: GeoFilter,
): Promise<{ products: Product[]; hasNextPage: boolean }> {
  const { sort, minPrice, maxPrice, isInStock } = filter
  const result = await ProductsService.getApiCatalogProductsSearch({
    tags: tag,
    page,
    pageSize: 20,
    sort,
    minPrice,
    maxPrice,
    isInStock,
  })
  void geo
  return {
    products: (result.items ?? []).map(mapProduct),
    hasNextPage: result.hasNextPage ?? false,
  }
}

/** Category page: full product list + category info. */
export async function fetchCategoryById(
  categoryId: string,
  page = 1,
  pageSize = 20,
  filter: ProductFilter = {},
  geo?: GeoFilter,
): Promise<{
  id: string
  name: string
  icon: LucideIcon
  products: Product[]
  hasNextPage: boolean
}> {
  const { sort, minPrice, maxPrice, isInStock } = filter
  const productsPromise = geo
    ? ProductsService.getApiCatalogProductsNearby({
        categoryId,
        lat: geo.lat,
        lon: geo.lng,
        radiusKm: geo.radiusKm,
        minPrice,
        maxPrice,
        isInStock,
        page,
        pageSize,
      })
    : ProductsService.getApiCatalogProductsSearch({
        categoryId,
        page,
        pageSize,
        sort,
        minPrice,
        maxPrice,
        isInStock,
      })
  const [catDto, productsResult] = await Promise.all([
    CategoriesService.getApiCatalogCategories({ id: categoryId }),
    productsPromise,
  ])

  return {
    id: catDto.id ?? '',
    name: catDto.name ?? '',
    icon: resolveIcon(catDto.name ?? ''),
    products: (productsResult.items ?? []).map(mapProduct),
    hasNextPage: productsResult.hasNextPage ?? false,
  }
}
