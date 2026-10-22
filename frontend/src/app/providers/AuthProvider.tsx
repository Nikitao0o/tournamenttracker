import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '../../types'
import { apiClient } from '../../shared/api/client'
import { storage } from '../../shared/api/storage'
import { AuthContext, type AuthContextType } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser())
  const [token, setToken] = useState<string | null>(() => storage.getToken())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token && user) {
      storage.setToken(token)
      storage.setUser(user)
    } else {
      storage.clearToken()
      storage.clearUser()
    }
  }, [token, user])

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

  const logout = () => {
    setToken(null)
    setUser(null)
    storage.clearToken()
    storage.clearUser()
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
