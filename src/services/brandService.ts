import { api } from '../lib/api'
import type { ApiResponse, PageResponse } from '../types/auth'
import type { BrandResponse, CreateBrandRequest } from '../types/brand'

const PLATFORM_BUSINESS_ID = 1

interface ProductBrandRecord {
  id: number
  businessId: number
  storeIds?: number[]
  brandCode: string
  brandName: string
  description?: string
  logo?: string
  isFeatured?: boolean
  isGlobal?: boolean
  status?: string
}

function catalogCode(value: string | undefined, name: string, prefix: string): string {
  const source = value?.trim() || name
  const normalized = source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 50)

  return normalized || `${prefix}_${Date.now().toString(36).toUpperCase()}`
}

function toBrand(record: ProductBrandRecord): BrandResponse {
  return {
    id: record.id,
    businessId: record.businessId,
    storeIds: record.storeIds,
    name: record.brandName,
    code: record.brandCode,
    logoUrl: record.logo,
    description: record.description,
    status: record.status,
    isFeatured: record.isFeatured,
    isGlobal: record.isGlobal,
    isPlatform: record.isGlobal,
  }
}

function toPayload(input: CreateBrandRequest, businessId: number) {
  return {
    businessId,
    brandCode: catalogCode(input.code, input.name, 'BRAND'),
    brandName: input.name.trim(),
    description: input.description?.trim() || null,
    logo: input.logoUrl?.trim() || null,
    storeIds: input.storeIds ?? [],
    isFeatured: input.isFeatured ?? false,
    isGlobal: input.isGlobal ?? true,
    status: input.status ?? 'ACTIVE',
  }
}

export const brandService = {
  async getBrands(businessId = PLATFORM_BUSINESS_ID): Promise<BrandResponse[]> {
    const res = await api.request<ApiResponse<PageResponse<ProductBrandRecord>>>(
      `/products/brands?businessId=${businessId}&page=0&size=100`
    )
    return (res.data?.content ?? []).map(toBrand)
  },

  async createBrand(input: CreateBrandRequest, businessId = PLATFORM_BUSINESS_ID): Promise<BrandResponse> {
    const res = await api.request<ApiResponse<ProductBrandRecord>>('/products/brands', {
      method: 'POST',
      body: JSON.stringify(toPayload(input, businessId)),
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to create brand.')
    }
    return toBrand(res.data)
  },

  async updateBrand(id: number, input: CreateBrandRequest, businessId = PLATFORM_BUSINESS_ID): Promise<BrandResponse> {
    const res = await api.request<ApiResponse<ProductBrandRecord>>(`/products/brands/${id}?businessId=${businessId}`, {
      method: 'PUT',
      body: JSON.stringify(toPayload(input, businessId)),
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to update brand.')
    }
    return toBrand(res.data)
  },

  async deleteBrand(id: number, businessId = PLATFORM_BUSINESS_ID): Promise<void> {
    await api.request<void>(`/products/brands/${id}?businessId=${businessId}`, {
      method: 'DELETE',
    })
  },
}
