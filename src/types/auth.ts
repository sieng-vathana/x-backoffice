export interface AuthUserSummary {
  id: number
  username: string
  fullName?: string
  permissions: string[]
}

export interface AuthenticatedUser {
  id: string
  username: string
  fullName?: string
  permissions: string[]
  isPlatformAdmin: boolean
}

export interface SignInInput {
  username: string
  password: string
}

export interface ApiResponse<T> {
  code: number
  message?: string
  data?: T
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}
