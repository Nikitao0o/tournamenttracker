import type { Tournament, User } from '../../types'

const TOKEN_KEY = 'tt_auth_token'
const USER_KEY = 'tt_auth_user'
const TOURNAMENTS_KEY = 'tt_tournaments_v1'

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
      // ignore
    }
  },
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // ignore
    }
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
      // ignore
    }
  },
  clearUser(): void {
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      // ignore
    }
  },

  getTournaments(): Tournament[] | null {
    try {
      const data = localStorage.getItem(TOURNAMENTS_KEY)
      return data ? (JSON.parse(data) as Tournament[]) : null
    } catch {
      return null
    }
  },
  setTournaments(tournaments: Tournament[]): void {
    try {
      localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments))
    } catch {
      // ignore
    }
  },
}
