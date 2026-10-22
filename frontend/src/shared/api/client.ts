import type {
  BracketMatch,
  BracketRoundGroup,
  CreateTournamentInput,
  Tournament,
  TournamentBracketView,
  UpdateTournamentInput,
  User,
} from '../../types'
import { getMockBracketForTournament, MOCK_TOURNAMENTS } from '../../mock/data'
import { storage } from './storage'

const API_BASE = '/api'

// Demo accounts for standalone offline fallback (from admins.txt and README)
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
        throw new Error(errorData.detail || 'Invalid email or password')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
        throw err
      }
    }

    // Fallback to local authentication when backend API is unavailable
    const normalizedEmail = email.trim().toLowerCase()
    const foundUser = SEED_USERS.find((u) => u.email.toLowerCase() === normalizedEmail)

    if (foundUser) {
      if (password.length < 6) {
        throw new Error('Password must contain at least 6 characters')
      }
      return {
        token: `mock-token-${foundUser.id}-${Date.now()}`,
        user: foundUser,
      }
    }

    // Check localStorage registered users
    const registeredUsers = storage.getUser()
    if (registeredUsers && registeredUsers.email.toLowerCase() === normalizedEmail) {
      return {
        token: `mock-token-${registeredUsers.id}-${Date.now()}`,
        user: registeredUsers,
      }
    }

    throw new Error('User with this email not found. Check credentials or register via Sign Up.')
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
        // Automatically login after registration
        const loginRes = await this.login(payload.email, payload.password)
        return {
          token: loginRes.token,
          user: { ...user, is_admin: user.is_admin ?? false },
        }
      }

      if (response.status >= 400) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Registration error')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
        throw err
      }
    }

    // Fallback creating empty account (player_id: null, no player profile)
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
      // Ignore network error and fall back to local data
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
      // Fallback
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
      // Fallback
    }

    const list = getLocalTournaments()
    const index = list.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error('Tournament not found')
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
      // Fallback
    }

    const list = getLocalTournaments().filter((t) => t.id !== id)
    storage.setTournaments(list)
  },

  async getTournamentBracket(tournamentId: string): Promise<TournamentBracketView> {
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/bracket`)
      if (response.ok) {
        const data = await response.json()
        return mapBracketView(data)
      }
    } catch {
      // Fallback
    }

    const custom = storage.getTournamentBracket(tournamentId)
    if (custom) return custom

    const tourneys = getLocalTournaments()
    const found =
      tourneys.find((t) => t.id === tournamentId) ||
      MOCK_TOURNAMENTS.find((t) => t.id === tournamentId)
    return getMockBracketForTournament(
      found || { id: tournamentId, title: 'Tournament Bracket', bracketType: 'double_elimination' }
    )
  },
}

function mapBracketMatch(raw: any): BracketMatch {
  return {
    id: raw.id,
    status: raw.status,
    scoreA: raw.score_a !== undefined ? raw.score_a : raw.scoreA,
    scoreB: raw.score_b !== undefined ? raw.score_b : raw.scoreB,
    date: raw.date,
    startTime: raw.start_time || raw.startTime,
    mapName: raw.map_name || raw.mapName,
    matchFormat: raw.match_format || raw.matchFormat || 'BO3',
    bracketType: raw.bracket_type || raw.bracketType,
    roundName: raw.round_name || raw.roundName,
    roundOrder: raw.round_order !== undefined ? raw.round_order : raw.roundOrder,
    teamAId: raw.team_a_id !== undefined ? raw.team_a_id : raw.teamAId,
    teamBId: raw.team_b_id !== undefined ? raw.team_b_id : raw.teamBId,
    teamAName: raw.team_a_name || raw.teamAName || 'TBD',
    teamBName: raw.team_b_name || raw.teamBName || 'TBD',
    teamALogoUrl: raw.team_a_logo_url || raw.teamALogoUrl,
    teamBLogoUrl: raw.team_b_logo_url || raw.teamBLogoUrl,
    winnerId: raw.winner_id !== undefined ? raw.winner_id : raw.winnerId,
    winnerName: raw.winner_name || raw.winnerName,
    tournamentId: raw.tournament_id !== undefined ? raw.tournament_id : raw.tournamentId,
    tournamentName: raw.tournament_name || raw.tournamentName,
    nextMatchId: raw.next_match_id !== undefined ? raw.next_match_id : raw.nextMatchId,
    nextLoserMatchId: raw.next_loser_match_id !== undefined ? raw.next_loser_match_id : raw.nextLoserMatchId,
  }
}

function mapBracketRound(raw: any): BracketRoundGroup {
  return {
    roundName: raw.round_name || raw.roundName || 'General',
    roundOrder: raw.round_order !== undefined ? raw.round_order : (raw.roundOrder || 1),
    matches: (raw.matches || []).map(mapBracketMatch),
  }
}

function mapBracketView(raw: any): TournamentBracketView {
  return {
    tournamentId: raw.tournament_id !== undefined ? raw.tournament_id : raw.tournamentId,
    tournamentTitle: raw.tournament_title || raw.tournamentTitle || 'Tournament Bracket',
    bracketType: raw.bracket_type || raw.bracketType || 'double_elimination',
    upperBracket: (raw.upper_bracket || raw.upperBracket || []).map(mapBracketRound),
    lowerBracket: (raw.lower_bracket || raw.lowerBracket || []).map(mapBracketRound),
    grandFinal: (raw.grand_final || raw.grandFinal) ? mapBracketMatch(raw.grand_final || raw.grandFinal) : null,
    allRounds: (raw.all_rounds || raw.allRounds || []).map(mapBracketRound),
  }
}
