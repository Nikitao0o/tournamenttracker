import type { CreateTournamentInput, Tournament, UpdateTournamentInput, User } from '../../types'
import { MOCK_TOURNAMENTS } from '../../mock/data'
import { storage } from './storage'

const API_BASE = '/api'

// Демо-аккаунты для автономной работы без бэкенда (из admins.txt и README)
const SEED_USERS: User[] = [
  {
    id: 1,
    email: 'admin@tracker.local',
    nickname: 'Admin',
    is_active: true,
    created_at: new Date().toISOString(),
    is_admin: true,
    player_id: null,
  },
  {
    id: 2,
    email: 'organizer@tracker.local',
    nickname: 'Organizer',
    is_active: true,
    created_at: new Date().toISOString(),
    is_admin: true,
    player_id: null,
  },
  {
    id: 3,
    email: 'user@tracker.local',
    nickname: 'donk',
    is_active: true,
    created_at: new Date().toISOString(),
    is_admin: false,
    player_id: 'donk',
  },
]

type BackendTournament = {
  id: number | string
  title: string
  prize_pool?: string
  prizePool?: string
  start_date?: string
  startDate?: string
  end_date?: string
  endDate?: string
  status: string
  location: string
  bracket_type?: string
  bracketType?: string
}

function mapTournament(item: BackendTournament): Tournament {
  return {
    id: String(item.id),
    title: item.title,
    prizePool: item.prize_pool ?? item.prizePool ?? '$0',
    startDate: item.start_date ?? item.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: item.end_date ?? item.endDate ?? new Date().toISOString().slice(0, 10),
    status: (item.status as Tournament['status']) || 'Upcoming',
    location: item.location || 'Online',
    bracketType: item.bracket_type ?? item.bracketType,
  }
}

function getLocalTournaments(): Tournament[] {
  const stored = storage.getTournaments()
  if (stored && stored.length > 0) {
    return stored
  }
  storage.setTournaments(MOCK_TOURNAMENTS)
  return MOCK_TOURNAMENTS
}

export const apiClient = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          token: data.access_token,
          user: data.user,
        }
      }

      if (response.status === 401 || response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Неверный email или пароль')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
        throw err
      }
    }

    // Фоллбэк на локальную авторизацию при недоступности API бэкенда
    const normalizedEmail = email.trim().toLowerCase()
    const foundUser = SEED_USERS.find((u) => u.email.toLowerCase() === normalizedEmail)

    if (foundUser) {
      if (password.length < 6) {
        throw new Error('Пароль должен содержать не менее 6 символов')
      }
      return {
        token: `mock-token-${foundUser.id}-${Date.now()}`,
        user: foundUser,
      }
    }

    // Проверяем зарегистрированных в localStorage пользователей
    const registeredUsers = storage.getUser()
    if (registeredUsers && registeredUsers.email.toLowerCase() === normalizedEmail) {
      return {
        token: `mock-token-${registeredUsers.id}-${Date.now()}`,
        user: registeredUsers,
      }
    }

    throw new Error('Пользователь с таким email не найден. Проверьте данные или создайте аккаунт через Sign Up.')
  },

  async register(payload: { email: string; nickname: string; password: string }): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const user = await response.json()
        // Автоматически логинимся после регистрации
        const loginRes = await this.login(payload.email, payload.password)
        return {
          token: loginRes.token,
          user: { ...user, is_admin: user.is_admin ?? false },
        }
      }

      if (response.status >= 400) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Ошибка регистрации')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
        throw err
      }
    }

    // Фоллбэк создания пустого аккаунта (player_id: null, без профиля игрока)
    const isAdmin = payload.email.toLowerCase().includes('admin') || payload.email.toLowerCase().includes('organizer')
    const newUser: User = {
      id: Date.now(),
      email: payload.email.trim(),
      nickname: payload.nickname.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
      is_admin: isAdmin,
      player_id: null,
    }

    storage.setUser(newUser)
    const token = `mock-token-${newUser.id}-${Date.now()}`
    storage.setToken(token)

    return {
      token,
      user: newUser,
    }
  },

  async getTournaments(): Promise<Tournament[]> {
    try {
      const response = await fetch(`${API_BASE}/tournaments`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapTournament)
          storage.setTournaments(mapped)
          return mapped
        }
      }
    } catch {
      // Игнорируем ошибку сети и переходим к локальным данным
    }

    return getLocalTournaments()
  },

  async createTournament(input: CreateTournamentInput, token?: string | null): Promise<Tournament> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const payload = {
        title: input.title,
        prize_pool: input.prizePool,
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status,
        location: input.location,
        bracket_type: input.bracketType || 'double_elimination',
      }

      const response = await fetch(`${API_BASE}/tournaments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        const newTournament = mapTournament(data)
        const current = getLocalTournaments()
        storage.setTournaments([newTournament, ...current])
        return newTournament
      }
    } catch {
      // Фоллбэк
    }

    const current = getLocalTournaments()
    const newTournament: Tournament = {
      id: String(Date.now()),
      title: input.title,
      prizePool: input.prizePool,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      location: input.location,
      bracketType: input.bracketType || 'double_elimination',
    }

    const updated = [newTournament, ...current]
    storage.setTournaments(updated)
    return newTournament
  },

  async updateTournament(id: string, input: UpdateTournamentInput, token?: string | null): Promise<Tournament> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const payload: Record<string, unknown> = {}
      if (input.title !== undefined) payload.title = input.title
      if (input.prizePool !== undefined) payload.prize_pool = input.prizePool
      if (input.startDate !== undefined) payload.start_date = input.startDate
      if (input.endDate !== undefined) payload.end_date = input.endDate
      if (input.status !== undefined) payload.status = input.status
      if (input.location !== undefined) payload.location = input.location
      if (input.bracketType !== undefined) payload.bracket_type = input.bracketType

      const response = await fetch(`${API_BASE}/tournaments/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        const updated = mapTournament(data)
        const list = getLocalTournaments().map((t) => (t.id === id ? updated : t))
        storage.setTournaments(list)
        return updated
      }
    } catch {
      // Фоллбэк
    }

    const list = getLocalTournaments()
    const index = list.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error('Турнир не найден')
    }

    const updated: Tournament = {
      ...list[index],
      ...input,
    }
    const newList = [...list]
    newList[index] = updated
    storage.setTournaments(newList)
    return updated
  },

  async deleteTournament(id: string, token?: string | null): Promise<void> {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`${API_BASE}/tournaments/${id}`, {
        method: 'DELETE',
        headers,
      })
    } catch {
      // Фоллбэк
    }

    const list = getLocalTournaments().filter((t) => t.id !== id)
    storage.setTournaments(list)
  },
}
