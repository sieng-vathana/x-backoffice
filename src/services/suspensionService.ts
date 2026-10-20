import { api } from '../lib/api'
import type { ApiResponse } from '../types/auth'
import type { StoreResponse } from '../types/store'
import type { BusinessApproval } from './businessApprovalService'

export interface ManagedMerchant extends BusinessApproval {
  suspended?: boolean
  suspendedAt?: string | null
  suspensionReason?: string | null
  suspendedByUserId?: number | null
}

export interface ManagedStore extends StoreResponse {
  suspended?: boolean
  suspendedAt?: string | null
  suspensionReason?: string | null
}

export interface MerchantOwnerProfile {
  id: number
  username: string
  fullName?: string | null
  phone?: string | null
  email?: string | null
  profileImage?: string | null
  status?: number | null
  lastLogin?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface MerchantProfile {
  merchant: ManagedMerchant
  owner: MerchantOwnerProfile
  stores: ManagedStore[]
}

export type MerchantFilter = '' | 'approved' | 'pending' | 'rejected' | 'suspended'
export type StoreFilter = '' | 'active' | 'suspended'

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}

/** Suspends or reinstates merchants and stores. The merchant is told by Telegram and email with the reason. */
export const suspensionService = {
  async merchantProfile(id: number): Promise<MerchantProfile> {
    const response = await api.request<ApiResponse<MerchantProfile>>(`/admin/merchants/${id}/profile`)
    if (!response.data) throw new Error(response.message || 'Could not load the merchant profile.')
    return response.data
  },

  async merchants(status: MerchantFilter, search: string): Promise<ManagedMerchant[]> {
    const response = await api.request<ApiResponse<ManagedMerchant[]>>(`/admin/merchants${query({ status, search: search.trim() })}`)
    return response.data ?? []
  },

  async stores(status: StoreFilter, search: string, businessId?: number): Promise<ManagedStore[]> {
    const response = await api.request<ApiResponse<ManagedStore[]>>(`/admin/stores${query({ status, search: search.trim(), businessId })}`)
    return response.data ?? []
  },

  async suspendMerchant(id: number, reason: string): Promise<ManagedMerchant> {
    const response = await api.request<ApiResponse<ManagedMerchant>>(`/admin/merchants/${id}/suspension`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    if (!response.data) throw new Error(response.message || 'Could not suspend the merchant.')
    return response.data
  },

  async reinstateMerchant(id: number): Promise<ManagedMerchant> {
    const response = await api.request<ApiResponse<ManagedMerchant>>(`/admin/merchants/${id}/suspension`, { method: 'DELETE' })
    if (!response.data) throw new Error(response.message || 'Could not reinstate the merchant.')
    return response.data
  },

  async changePlan(id: number, plan: string, billingCycle: string): Promise<ManagedMerchant> {
    const response = await api.request<ApiResponse<ManagedMerchant>>(`/admin/merchants/${id}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan, billingCycle }),
    })
    if (!response.data) throw new Error(response.message || 'Could not change the plan.')
    return response.data
  },

  async suspendStore(id: number, reason: string): Promise<ManagedStore> {
    const response = await api.request<ApiResponse<ManagedStore>>(`/admin/stores/${id}/suspension`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    if (!response.data) throw new Error(response.message || 'Could not suspend the store.')
    return response.data
  },

  async reinstateStore(id: number): Promise<ManagedStore> {
    const response = await api.request<ApiResponse<ManagedStore>>(`/admin/stores/${id}/suspension`, { method: 'DELETE' })
    if (!response.data) throw new Error(response.message || 'Could not reinstate the store.')
    return response.data
  },
}
