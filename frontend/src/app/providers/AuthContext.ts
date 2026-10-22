import { createContext } from 'react'
import type { User } from '../../types'

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (payload: { email: string; nickname: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
