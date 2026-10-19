import { api } from '../lib/api'
import { readStoredValue, writeStoredValue, removeStoredValue } from '../lib/storage'
import type { ApiResponse, AuthenticatedUser, SignInInput } from '../types/auth'

const AUTH_USER_KEY = 'x_backoffice_user'
export const AUTH_TOKEN_KEY = 'x_backoffice_token'

interface BackendAuthData {
  user?: {
    id: number
    username: string
    fullName?: string
    permissions?: string[]
  }
  accessToken?: string
  refreshToken?: string
  mfaRequired?: boolean
  mfaMethod?: string
  mfaChallengeToken?: string
  mfaExpiresAt?: string
  mfaDestination?: string
}

export class MfaRequiredError extends Error {
  readonly challengeToken: string
  readonly expiresAt?: string
  readonly method: 'EMAIL' | 'TELEGRAM'
  readonly destination?: string

  constructor(challengeToken: string, method: 'EMAIL' | 'TELEGRAM', expiresAt?: string, destination?: string) {
    super(method === 'EMAIL' ? 'Enter the email code to finish signing in.' : 'Enter the Telegram code to finish signing in.')
    this.name = 'MfaRequiredError'
    this.challengeToken = challengeToken
    this.expiresAt = expiresAt
    this.method = method
    this.destination = destination
  }
}

function mapUser(data: BackendAuthData['user']): AuthenticatedUser {
  const permissions = data?.permissions ?? []
  const isPlatformAdmin = permissions.includes('platform:admin')

  return {
    id: String(data?.id ?? ''),
    username: data?.username ?? '',
    fullName: data?.fullName ?? data?.username ?? '',
    permissions,
    isPlatformAdmin,
  }
}

export const authService = {
  getStoredUser(): AuthenticatedUser | null {
    return readStoredValue<AuthenticatedUser | null>(AUTH_USER_KEY, null)
  },

  getStoredToken(): string | null {
    return readStoredValue<string | null>(AUTH_TOKEN_KEY, null)
  },

  async login(input: SignInInput): Promise<AuthenticatedUser> {
    const res = await api.request<ApiResponse<BackendAuthData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    if (res.data?.mfaRequired && res.data.mfaChallengeToken) {
      throw new MfaRequiredError(res.data.mfaChallengeToken,
        res.data.mfaMethod === 'EMAIL' ? 'EMAIL' : 'TELEGRAM', res.data.mfaExpiresAt, res.data.mfaDestination)
    }

    if (!res.data?.user) {
      throw new Error(res.message || 'Invalid credentials or user not returned.')
    }

    if (res.data.accessToken) {
      writeStoredValue(AUTH_TOKEN_KEY, res.data.accessToken)
    }

    const user = mapUser(res.data.user)
    writeStoredValue(AUTH_USER_KEY, user)
    return user
  },

  async verifyMfaSignIn(input: { username: string; challengeToken: string; code: string; method: 'EMAIL' | 'TELEGRAM' }): Promise<AuthenticatedUser> {
    const endpoint = input.method === 'EMAIL' ? '/auth/verify-email' : '/auth/verify-telegram'
    const { method: _method, ...request } = input
    const res = await api.request<ApiResponse<BackendAuthData>>(endpoint, {
      method: 'POST', body: JSON.stringify(request),
    })
    if (!res.data?.user) throw new Error(res.message || 'The verification code could not be verified.')
    if (res.data.accessToken) writeStoredValue(AUTH_TOKEN_KEY, res.data.accessToken)
    const user = mapUser(res.data.user)
    writeStoredValue(AUTH_USER_KEY, user)
    return user
  },

  async refresh(): Promise<AuthenticatedUser | null> {
    try {
      const res = await api.request<ApiResponse<BackendAuthData>>('/auth/refresh', {
        method: 'POST',
      })
      if (res.data?.user) {
        if (res.data.accessToken) {
          writeStoredValue(AUTH_TOKEN_KEY, res.data.accessToken)
        }
        const user = mapUser(res.data.user)
        writeStoredValue(AUTH_USER_KEY, user)
        return user
      }
      return null
    } catch {
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await api.request<ApiResponse<void>>('/auth/logout', {
        method: 'POST',
      })
    } finally {
      removeStoredValue(AUTH_USER_KEY)
      removeStoredValue(AUTH_TOKEN_KEY)
    }
  },
}
