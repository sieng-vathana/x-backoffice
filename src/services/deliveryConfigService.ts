import { api } from '../lib/api'
import type { ApiResponse } from '../types/auth'

export type DeliveryProvider = 'GRAB' | 'VIREAK_BUNTHAM' | 'OWN_RIDER'

export interface StoreDeliveryConfig {
  storeId: number
  businessId: number
  enabledProviders: DeliveryProvider[]
  defaultProvider: DeliveryProvider
  integrationMode: 'SIMULATED' | 'LIVE'
  updatedAt?: string | null
}

export interface UpdateStoreDeliveryConfig {
  enabledProviders: DeliveryProvider[]
  defaultProvider: DeliveryProvider
}

export const deliveryConfigService = {
  async getStoreConfig(storeId: number): Promise<StoreDeliveryConfig> {
    const response = await api.request<ApiResponse<StoreDeliveryConfig>>(`/deliveries/stores/${storeId}/config`)
    if (!response.data) throw new Error(response.message || 'Could not load delivery settings.')
    return response.data
  },

  async updateStoreConfig(storeId: number, config: UpdateStoreDeliveryConfig): Promise<StoreDeliveryConfig> {
    const response = await api.request<ApiResponse<StoreDeliveryConfig>>(`/deliveries/stores/${storeId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    })
    if (!response.data) throw new Error(response.message || 'Could not save delivery settings.')
    return response.data
  },
}
