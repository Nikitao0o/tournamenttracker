import { useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../../types'
import { apiClient } from '../../shared/api/client'
import { storage } from '../../shared/api/storage'
import { AuthContext, type AuthContextType } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser())
  const [token, setToken] = useState<string | null>(() => storage.getToken())
  const [isLoading, setIsLoading] = useState(false)

  const logout = useCallback(() => {
    apiClient.logout().catch(() => {})
    setToken(null)
    setUser(null)
    storage.clearAuth()
  }, [])

  useEffect(() => {
    // Validate session on app launch
    if (token) {
      apiClient
        .getMe()
        .then((freshUser) => {
          setUser(freshUser)
        })
        .catch(() => {
          // Token invalid or expired and refresh failed
          logout()
        })
    }
  }, [token, logout])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const res = await apiClient.login(email, password)
      setToken(res.token)
      setUser(res.user)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: {
    email: string
    nickname: string
    password: string
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const res = await apiClient.register(payload)
      setToken(res.token)
      setUser(res.user)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user?.is_admin),
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
