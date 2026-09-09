import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import type { AuthenticatedUser, SignInInput } from '../types/auth'

interface AuthContextType {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (input: SignInInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => authService.getStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    authService
      .refresh()
      .then((restored) => {
        if (mounted && restored) {
          setUser(restored)
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    const handleExpired = () => {
      setUser(null)
    }
    window.addEventListener('backoffice:session-expired', handleExpired)

    return () => {
      mounted = false
      window.removeEventListener('backoffice:session-expired', handleExpired)
    }
  }, [])

  const signIn = useCallback(async (input: SignInInput) => {
    const loggedIn = await authService.login(input)
    setUser(loggedIn)
  }, [])

  const signOut = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
