import { api } from '../lib/api'
import type { ApiResponse } from '../types/auth'

export interface BusinessApproval {
  id: number
  ownerUserId: number
  name: string
  code: string
  defaultCurrencyCode: string
  taxRegistrationNumber?: string | null
  taxRegistrationLabel?: string | null
  usdToKhrExchangeRate?: number | null
  defaultTaxId?: number | null
  pricesIncludeTax?: boolean | null
  timeZone: string
  fiscalYearStartMonth?: number | null
  status: number
  updatedAt?: string | null
  bakongAccountId?: string | null
  reviewReason?: string | null
  reviewedByUserId?: number | null
  reviewedAt?: string | null
  suspended?: boolean
  suspendedAt?: string | null
  suspensionReason?: string | null
  suspendedByUserId?: number | null
  createdAt?: string | null
  /** STARTER, BUSINESS or PRO; null for merchants created before plans (treated as Pro). */
  plan?: string | null
  billingCycle?: string | null
  trialEndsAt?: string | null
}

export const businessApprovalService = {
  async pending(): Promise<BusinessApproval[]> {
    const response = await api.request<ApiResponse<BusinessApproval[]>>('/businesses/approvals/pending')
    return response.data ?? []
  },

  async approve(id: number): Promise<BusinessApproval> {
    const response = await api.request<ApiResponse<BusinessApproval>>(`/businesses/${id}/approval/approve`, { method: 'POST' })
    if (!response.data) throw new Error(response.message || 'Could not approve merchant.')
    return response.data
  },

  async reject(id: number, reason: string): Promise<BusinessApproval> {
    const response = await api.request<ApiResponse<BusinessApproval>>(`/businesses/${id}/approval/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    if (!response.data) throw new Error(response.message || 'Could not reject merchant.')
    return response.data
  },
}
