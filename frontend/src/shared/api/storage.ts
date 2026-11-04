import type { User } from '../../types'

const TOKEN_KEY = 'tt_auth_token'
const REFRESH_TOKEN_KEY = 'tt_refresh_token'
const USER_KEY = 'tt_auth_user'

export const storage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
    }
  },
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      return null
    }
  },
  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    } catch {
    }
  },
  clearRefreshToken(): void {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch {
    }
  },
  clearAuth(): void {
    this.clearToken()
    this.clearRefreshToken()
    this.clearUser()
  },

  getUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY)
      return data ? (JSON.parse(data) as User) : null
    } catch {
      return null
    }
  },
  setUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
    }
  },
  clearUser(): void {
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
    }
  },
}
