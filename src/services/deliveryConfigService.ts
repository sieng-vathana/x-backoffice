import { api } from '../lib/api'
import type { ApiResponse } from '../types/auth'

export type DeliveryProvider = 'GRAB' | 'VIREAK_BUNTHAM' | 'OWN_RIDER'

export interface DeliveryProviderOption {
  providerType: DeliveryProvider
  displayName: string
  enabled: boolean
  integrationMode: 'SIMULATED' | 'LIVE'
}

export const deliveryConfigService = {
  async getProviders(): Promise<DeliveryProviderOption[]> {
    const response = await api.request<ApiResponse<DeliveryProviderOption[]>>('/deliveries/providers')
    if (!response.data) throw new Error(response.message || 'Could not load delivery providers.')
    return response.data
  },

  async updateProviders(enabledProviders: DeliveryProvider[]): Promise<DeliveryProviderOption[]> {
    const response = await api.request<ApiResponse<DeliveryProviderOption[]>>('/deliveries/providers', {
      method: 'PUT',
      body: JSON.stringify({ enabledProviders }),
    })
    if (!response.data) throw new Error(response.message || 'Could not save delivery providers.')
    return response.data
  },
}
