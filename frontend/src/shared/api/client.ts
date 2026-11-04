import type {
  BracketMatch,
  BracketRoundGroup,
  BracketType,
  CreatePlayerInput,
  CreateTeamInput,
  CreateTournamentInput,
  LeaderboardPlayer,
  LeaderboardTeam,
  Match,
  Player,
  Team,
  Tournament,
  TournamentBracketView,
  UpdateTournamentInput,
  User,
} from '../../types'
import { storage } from './storage'

const API_BASE = '/api'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

interface BackendTournament {
  id: number | string
  title: string
  prize_pool?: string
  prizePool?: string
  start_date?: string
  startDate?: string
  end_date?: string
  endDate?: string
  status?: 'Ongoing' | 'Upcoming' | 'Completed'
  location?: string
  bracket_type?: BracketType
  bracketType?: BracketType
}

interface BackendPlayerSummary {
  nickname?: string
  name?: string
}

interface BackendTeam {
  id: number | string
  name: string
  short_name?: string
  shortName?: string
  region?: string
  coach?: string
  description?: string
  ranking?: number
  players?: BackendPlayerSummary[]
  roster?: string[]
  logo_url?: string | null
  logoUrl?: string | null
  points?: number
  win_rate?: number
  winRate?: number
}

interface BackendPlayer {
  id: number | string
  nickname?: string
  name: string
  age?: number
  role?: string
  nationality?: string
  kd?: string | number
  impact?: number
  maps?: number
  team_id?: number | string
  teamId?: number | string
  team_name?: string
  teamName?: string
  avatar_url?: string | null
  avatarUrl?: string | null
  rating?: number
  adr?: number
}

interface BackendMapResult {
  id: number
  match_id: number
  map_number: number
  map_name: string
  score_a: number
  score_b: number
  winner_id?: number | null
  winner_name?: string | null
}

interface BackendPlayerMatchStat {
  id: number
  match_id: number
  map_id?: number | null
  player_id: number
  player_nickname: string
  team_id: number
  team_name: string
  kills: number
  deaths: number
  assists: number
  headshots: number
  adr: number
  kast: number
  rating: number
  is_mvp?: boolean
}

interface BackendMatch {
  id: number | string
  team_a_name?: string
  teamAName?: string
  team_a?: { name: string; logo_url?: string }
  team_b_name?: string
  teamBName?: string
  team_b?: { name: string; logo_url?: string }
  team_a_id?: number | null
  teamAId?: number | null
  team_b_id?: number | null
  teamBId?: number | null
  team_a_logo_url?: string | null
  teamALogoUrl?: string | null
  team_b_logo_url?: string | null
  teamBLogoUrl?: string | null
  score_a?: number | null
  scoreA?: number | null
  score_b?: number | null
  scoreB?: number | null
  status?: 'UPCOMING' | 'LIVE' | 'FINISHED'
  tournament_id?: number | string
  tournamentId?: number | string
  tournament_name?: string
  tournamentName?: string
  tournament?: { title: string }
  date?: string
  start_time?: string
  startTime?: string
  map_name?: string
  mapName?: string
  match_format?: string
  matchFormat?: string
  bracket_type?: string
  bracketType?: string
  round_name?: string
  roundName?: string
  round_order?: number
  roundOrder?: number
  winner_id?: number | null
  winnerId?: number | null
  winner_name?: string | null
  winnerName?: string | null
  next_match_id?: number | null
  nextMatchId?: number | null
  next_loser_match_id?: number | null
  nextLoserMatchId?: number | null
  map_results?: BackendMapResult[]
  player_stats?: BackendPlayerMatchStat[]
}

interface BackendBracketRound {
  round_name?: string
  roundName?: string
  round_order?: number
  roundOrder?: number
  matches?: BackendMatch[]
}

interface BackendBracketView {
  tournament_id?: number | string
  tournamentId?: number | string
  tournament_title?: string
  tournamentTitle?: string
  bracket_type?: BracketType
  bracketType?: BracketType
  upper_bracket?: BackendBracketRound[]
  upperBracket?: BackendBracketRound[]
  lower_bracket?: BackendBracketRound[]
  lowerBracket?: BackendBracketRound[]
  grand_final?: BackendMatch | null
  grandFinal?: BackendMatch | null
  all_rounds?: BackendBracketRound[]
  allRounds?: BackendBracketRound[]
}

// Mappers converting backend models (snake_case, int IDs) to frontend camelCase
export function mapBackendTournament(item: BackendTournament): Tournament {
  return {
    id: String(item.id),
    title: item.title,
    prizePool: item.prize_pool ?? item.prizePool ?? '$0',
    startDate: item.start_date ?? item.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: item.end_date ?? item.endDate ?? new Date().toISOString().slice(0, 10),
    status: item.status || 'Upcoming',
    location: item.location || 'Online',
    bracketType: item.bracket_type ?? item.bracketType ?? 'double_elimination',
  }
}

export function mapBackendTeam(item: BackendTeam): Team {
  return {
    id: String(item.id),
    name: item.name,
    shortName: item.short_name ?? item.shortName ?? item.name.slice(0, 4).toUpperCase(),
    region: item.region || 'Global',
    coach: item.coach || 'Head Coach',
    description: item.description || '',
    ranking: item.ranking || 1,
    roster: Array.isArray(item.players)
      ? item.players.map((p: BackendPlayerSummary) => p.nickname || p.name || 'Player')
      : (item.roster || []),
    logoUrl: item.logo_url ?? item.logoUrl ?? null,
    points: item.points,
    winRate: item.win_rate ?? item.winRate,
  }
}

export function mapBackendPlayer(item: BackendPlayer): Player {
  const kdVal = typeof item.kd === 'string' ? item.kd : (item.kd ? String(item.kd) : '1.00')
  return {
    id: String(item.id),
    nickname: item.nickname,
    name: item.nickname ? `${item.nickname} (${item.name})` : item.name,
    age: item.age || 20,
    role: item.role || 'Rifler',
    nationality: item.nationality || 'International',
    teamId: String(item.team_id ?? item.teamId ?? '1'),
    teamName: item.team_name ?? item.teamName ?? '',
    avatarUrl: item.avatar_url ?? item.avatarUrl ?? null,
    stats: {
      kd: kdVal,
      impact: Number(item.impact) || 8.0,
      maps: Number(item.maps) || 0,
      rating: item.rating ? Number(item.rating) : undefined,
      adr: item.adr ? Number(item.adr) : undefined,
    },
  }
}

export function mapBackendMatch(raw: BackendMatch): Match {
  return {
    id: String(raw.id),
    teamA: raw.team_a_name ?? raw.teamAName ?? (raw.team_a?.name || 'TBD'),
    teamB: raw.team_b_name ?? raw.teamBName ?? (raw.team_b?.name || 'TBD'),
    teamAId: raw.team_a_id ?? raw.teamAId,
    teamBId: raw.team_b_id ?? raw.teamBId,
    teamALogoUrl: raw.team_a_logo_url ?? raw.teamALogoUrl ?? raw.team_a?.logo_url,
    teamBLogoUrl: raw.team_b_logo_url ?? raw.teamBLogoUrl ?? raw.team_b?.logo_url,
    scoreA: raw.score_a ?? raw.scoreA,
    scoreB: raw.score_b ?? raw.scoreB,
    status: raw.status || 'UPCOMING',
    tournamentId: String(raw.tournament_id ?? raw.tournamentId ?? '1'),
    tournamentName: raw.tournament_name ?? raw.tournamentName ?? (raw.tournament?.title || 'Tournament'),
    date: raw.date || new Date().toISOString().slice(0, 10),
    startTime: raw.start_time ?? raw.startTime,
    map: raw.map_name ?? raw.mapName,
    mapName: raw.map_name ?? raw.mapName,
    matchFormat: raw.match_format ?? raw.matchFormat ?? 'BO3',
    bracketType: raw.bracket_type ?? raw.bracketType,
    roundName: raw.round_name ?? raw.roundName,
    roundOrder: raw.round_order ?? raw.roundOrder,
    winnerId: raw.winner_id ?? raw.winnerId,
    winnerName: raw.winner_name ?? raw.winnerName,
    nextMatchId: raw.next_match_id ?? raw.nextMatchId,
    nextLoserMatchId: raw.next_loser_match_id ?? raw.nextLoserMatchId,
    mapResults: Array.isArray(raw.map_results)
      ? raw.map_results.map((mr: BackendMapResult) => ({
          id: mr.id,
          matchId: mr.match_id,
          mapNumber: mr.map_number,
          mapName: mr.map_name,
          scoreA: mr.score_a,
          scoreB: mr.score_b,
          winnerId: mr.winner_id,
          winnerName: mr.winner_name,
        }))
      : [],
    playerStats: Array.isArray(raw.player_stats)
      ? raw.player_stats.map((ps: BackendPlayerMatchStat) => ({
          id: ps.id,
          matchId: ps.match_id,
          mapId: ps.map_id,
          playerId: ps.player_id,
          playerNickname: ps.player_nickname,
          teamId: ps.team_id,
          teamName: ps.team_name,
          kills: ps.kills,
          deaths: ps.deaths,
          assists: ps.assists,
          headshots: ps.headshots,
          adr: ps.adr,
          kast: ps.kast,
          rating: ps.rating,
          isMvp: Boolean(ps.is_mvp),
        }))
      : [],
  }
}

export function mapBracketMatch(raw: BackendMatch): BracketMatch {
  return {
    id: raw.id,
    status: raw.status || 'UPCOMING',
    scoreA: raw.score_a !== undefined ? raw.score_a : raw.scoreA,
    scoreB: raw.score_b !== undefined ? raw.score_b : raw.scoreB,
    date: raw.date || '',
    startTime: raw.start_time || raw.startTime,
    mapName: raw.map_name || raw.mapName,
    matchFormat: raw.match_format || raw.matchFormat || 'BO3',
    bracketType: raw.bracket_type || raw.bracketType,
    roundName: raw.round_name || raw.roundName,
    roundOrder: raw.round_order !== undefined ? raw.round_order : raw.roundOrder,
    teamAId: raw.team_a_id !== undefined ? raw.team_a_id : raw.teamAId,
    teamBId: raw.team_b_id !== undefined ? raw.team_b_id : raw.teamBId,
    teamAName: raw.team_a_name || raw.teamAName || (raw.team_a?.name || 'TBD'),
    teamBName: raw.team_b_name || raw.teamBName || (raw.team_b?.name || 'TBD'),
    teamALogoUrl: raw.team_a_logo_url || raw.teamALogoUrl || raw.team_a?.logo_url,
    teamBLogoUrl: raw.team_b_logo_url || raw.teamBLogoUrl || raw.team_b?.logo_url,
    winnerId: raw.winner_id !== undefined ? raw.winner_id : raw.winnerId,
    winnerName: raw.winner_name || raw.winnerName,
    tournamentId: raw.tournament_id !== undefined ? raw.tournament_id : (raw.tournamentId || 1),
    nextMatchId: raw.next_match_id !== undefined ? raw.next_match_id : raw.nextMatchId,
    nextLoserMatchId: raw.next_loser_match_id !== undefined ? raw.next_loser_match_id : raw.nextLoserMatchId,
  }
}

export function mapBracketRound(raw: BackendBracketRound): BracketRoundGroup {
  return {
    roundName: raw.round_name || raw.roundName || 'General',
    roundOrder: raw.round_order !== undefined ? raw.round_order : (raw.roundOrder || 1),
    matches: (raw.matches || []).map(mapBracketMatch),
  }
}

export function mapBracketView(raw: BackendBracketView): TournamentBracketView {
  return {
    tournamentId: raw.tournament_id !== undefined ? raw.tournament_id : (raw.tournamentId || 1),
    tournamentTitle: raw.tournament_title || raw.tournamentTitle || 'Tournament Bracket',
    bracketType: raw.bracket_type || raw.bracketType || 'double_elimination',
    upperBracket: (raw.upper_bracket || raw.upperBracket || []).map(mapBracketRound),
    lowerBracket: (raw.lower_bracket || raw.lowerBracket || []).map(mapBracketRound),
    grandFinal: (raw.grand_final || raw.grandFinal) ? mapBracketMatch(raw.grand_final || raw.grandFinal!) : null,
    allRounds: (raw.all_rounds || raw.allRounds || []).map(mapBracketRound),
  }
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

async function requestWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = storage.getToken()
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    const refreshToken = storage.getRefreshToken()
    if (!refreshToken) {
      storage.clearAuth()
      return response
    }

    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (refreshRes.ok) {
          const data = await refreshRes.json()
          storage.setToken(data.access_token)
          if (data.refresh_token) storage.setRefreshToken(data.refresh_token)
          isRefreshing = false
          onTokenRefreshed(data.access_token)

          headers.set('Authorization', `Bearer ${data.access_token}`)
          return fetch(url, { ...options, headers })
        } else {
          isRefreshing = false
          storage.clearAuth()
          return response
        }
      } catch {
        isRefreshing = false
        storage.clearAuth()
        return response
      }
    }

    return new Promise((resolve) => {
      refreshSubscribers.push((newToken) => {
        headers.set('Authorization', `Bearer ${newToken}`)
        resolve(fetch(url, { ...options, headers }))
      })
    })
  }

  return response
}

export const apiClient = {
  // Auth methods
  async login(email: string, password: string): Promise<{ token: string; refreshToken?: string; user: User }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (response.ok) {
      const data = await response.json()
      storage.setToken(data.access_token)
      if (data.refresh_token) storage.setRefreshToken(data.refresh_token)
      storage.setUser(data.user)
      return {
        token: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      }
    }

    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Invalid email or password')
  },

  async register(payload: { email: string; nickname: string; password: string }): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const loginRes = await this.login(payload.email, payload.password)
      return {
        token: loginRes.token,
        user: loginRes.user,
      }
    }

    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Registration failed. Check your data.')
  },

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken()
    if (refreshToken) {
      try {
        await requestWithAuth(`${API_BASE}/auth/logout`, {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      } catch {
      }
    }
    storage.clearAuth()
  },

  async getMe(): Promise<User> {
    const response = await requestWithAuth(`${API_BASE}/auth/me`)
    if (!response.ok) throw new Error('Failed to get current user profile')
    const user = await response.json()
    storage.setUser(user)
    return user
  },

  async updateMe(payload: { nickname?: string; password?: string; avatar_url?: string }): Promise<User> {
    const response = await requestWithAuth(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update profile')
    }
    const updated = await response.json()
    storage.setUser(updated)
    return updated
  },

  // Tournaments
  async getTournaments(statusFilter?: string): Promise<Tournament[]> {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
    const response = await requestWithAuth(`${API_BASE}/tournaments${q}`)
    if (!response.ok) throw new Error('Failed to fetch tournaments')
    const data = await response.json()
    const mapped = data.map(mapBackendTournament)
    storage.setTournaments(mapped)
    return mapped
  },

  async getTournament(id: string | number): Promise<Tournament> {
    const response = await requestWithAuth(`${API_BASE}/tournaments/${id}`)
    if (!response.ok) throw new Error(`Tournament with id=${id} not found`)
    const data = await response.json()
    return mapBackendTournament(data)
  },

  async createTournament(input: CreateTournamentInput): Promise<Tournament> {
    const payload = {
      title: input.title,
      prize_pool: input.prizePool,
      start_date: input.startDate,
      end_date: input.endDate,
      status: input.status,
      location: input.location,
      bracket_type: input.bracketType || 'double_elimination',
    }
    const response = await requestWithAuth(`${API_BASE}/tournaments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to create tournament')
    }
    const data = await response.json()
    return mapBackendTournament(data)
  },

  async updateTournament(id: string | number, input: UpdateTournamentInput): Promise<Tournament> {
    const payload: Record<string, unknown> = {}
    if (input.title !== undefined) payload.title = input.title
    if (input.prizePool !== undefined) payload.prize_pool = input.prizePool
    if (input.startDate !== undefined) payload.start_date = input.startDate
    if (input.endDate !== undefined) payload.end_date = input.endDate
    if (input.status !== undefined) payload.status = input.status
    if (input.location !== undefined) payload.location = input.location
    if (input.bracketType !== undefined) payload.bracket_type = input.bracketType

    const response = await requestWithAuth(`${API_BASE}/tournaments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update tournament')
    }
    const data = await response.json()
    return mapBackendTournament(data)
  },

  async deleteTournament(id: string | number): Promise<void> {
    const response = await requestWithAuth(`${API_BASE}/tournaments/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to delete tournament')
    }
  },

  async getTournamentBracket(tournamentId: string | number): Promise<TournamentBracketView> {
    const response = await requestWithAuth(`${API_BASE}/tournaments/${tournamentId}/bracket`)
    if (!response.ok) throw new Error('Failed to load tournament bracket')
    const data = await response.json()
    return mapBracketView(data)
  },

  async generateBracket(
    tournamentId: string | number,
    payload: { name: string; bracket_type: string; team_ids: number[]; match_format?: string }
  ): Promise<TournamentBracketView> {
    const response = await requestWithAuth(`${API_BASE}/tournaments/${tournamentId}/bracket/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to generate bracket')
    }
    const data = await response.json()
    return mapBracketView(data)
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const response = await requestWithAuth(`${API_BASE}/teams`)
    if (!response.ok) throw new Error('Failed to fetch teams')
    const data = await response.json()
    const mapped = data.map(mapBackendTeam)
    storage.setTeams(mapped)
    return mapped
  },

  async getTeam(id: string | number): Promise<Team> {
    const response = await requestWithAuth(`${API_BASE}/teams/${id}`)
    if (!response.ok) throw new Error(`Team #${id} not found`)
    const data = await response.json()
    return mapBackendTeam(data)
  },

  async getTeamPlayers(teamId: string | number): Promise<Player[]> {
    const response = await requestWithAuth(`${API_BASE}/teams/${teamId}/players`)
    if (!response.ok) throw new Error('Failed to fetch team roster')
    const data = await response.json()
    return data.map(mapBackendPlayer)
  },

  async createTeam(input: CreateTeamInput): Promise<Team> {
    const payload = {
      name: input.name,
      short_name: input.shortName,
      region: input.region,
      coach: input.coach,
      description: input.description,
      ranking: input.ranking || 1,
      logo_url: input.logoUrl || null,
    }
    const response = await requestWithAuth(`${API_BASE}/teams`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to create team')
    }
    const data = await response.json()
    return mapBackendTeam(data)
  },

  async updateTeam(id: string | number, input: Partial<CreateTeamInput>): Promise<Team> {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name
    if (input.shortName !== undefined) payload.short_name = input.shortName
    if (input.region !== undefined) payload.region = input.region
    if (input.coach !== undefined) payload.coach = input.coach
    if (input.description !== undefined) payload.description = input.description
    if (input.ranking !== undefined) payload.ranking = input.ranking
    if (input.logoUrl !== undefined) payload.logo_url = input.logoUrl

    const response = await requestWithAuth(`${API_BASE}/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update team')
    }
    const data = await response.json()
    return mapBackendTeam(data)
  },

  async deleteTeam(id: string | number): Promise<void> {
    const response = await requestWithAuth(`${API_BASE}/teams/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to delete team')
    }
  },

  async uploadTeamLogo(teamId: string | number, image_base64: string): Promise<Team> {
    const response = await requestWithAuth(`${API_BASE}/teams/${teamId}/logo`, {
      method: 'POST',
      body: JSON.stringify({ image_base64 }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to upload team logo')
    }
    const data = await response.json()
    return mapBackendTeam(data)
  },

  // Players
  async getPlayers(teamId?: number): Promise<Player[]> {
    const q = teamId ? `?team_id=${teamId}` : ''
    const response = await requestWithAuth(`${API_BASE}/players${q}`)
    if (!response.ok) throw new Error('Failed to fetch players')
    const data = await response.json()
    const mapped = data.map(mapBackendPlayer)
    storage.setPlayers(mapped)
    return mapped
  },

  async getPlayer(id: string | number): Promise<Player> {
    const response = await requestWithAuth(`${API_BASE}/players/${id}`)
    if (!response.ok) throw new Error(`Player #${id} not found`)
    const data = await response.json()
    return mapBackendPlayer(data)
  },

  async createPlayer(input: CreatePlayerInput): Promise<Player> {
    const payload = {
      nickname: input.nickname || input.name.split(' ')[0],
      name: input.name,
      age: input.age || 20,
      role: input.role,
      nationality: input.nationality,
      kd: input.stats?.kd || '1.10',
      impact: input.stats?.impact || 8.5,
      maps: input.stats?.maps || 50,
      team_id: Number(input.teamId),
      avatar_url: input.avatarUrl || null,
    }
    const response = await requestWithAuth(`${API_BASE}/players`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to create player')
    }
    const data = await response.json()
    return mapBackendPlayer(data)
  },

  async updatePlayer(id: string | number, input: Partial<CreatePlayerInput>): Promise<Player> {
    const payload: Record<string, unknown> = {}
    if (input.nickname !== undefined) payload.nickname = input.nickname
    if (input.name !== undefined) payload.name = input.name
    if (input.age !== undefined) payload.age = input.age
    if (input.role !== undefined) payload.role = input.role
    if (input.nationality !== undefined) payload.nationality = input.nationality
    if (input.stats?.kd !== undefined) payload.kd = input.stats.kd
    if (input.stats?.impact !== undefined) payload.impact = input.stats.impact
    if (input.stats?.maps !== undefined) payload.maps = input.stats.maps
    if (input.teamId !== undefined) payload.team_id = Number(input.teamId)
    if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl

    const response = await requestWithAuth(`${API_BASE}/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update player')
    }
    const data = await response.json()
    return mapBackendPlayer(data)
  },

  async deletePlayer(id: string | number): Promise<void> {
    const response = await requestWithAuth(`${API_BASE}/players/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to delete player')
    }
  },

  async uploadPlayerAvatar(playerId: string | number, image_base64: string): Promise<Player> {
    const response = await requestWithAuth(`${API_BASE}/players/${playerId}/avatar`, {
      method: 'POST',
      body: JSON.stringify({ image_base64 }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to upload player avatar')
    }
    const data = await response.json()
    return mapBackendPlayer(data)
  },

  // Matches
  async getMatches(filter?: { status?: string; tournamentId?: number; teamId?: number }): Promise<Match[]> {
    const params = new URLSearchParams()
    if (filter?.status) params.set('status', filter.status)
    if (filter?.tournamentId) params.set('tournament_id', String(filter.tournamentId))
    if (filter?.teamId) params.set('team_id', String(filter.teamId))
    const q = params.toString() ? `?${params.toString()}` : ''

    const response = await requestWithAuth(`${API_BASE}/matches${q}`)
    if (!response.ok) throw new Error('Failed to fetch matches')
    const data = await response.json()
    const mapped = data.map(mapBackendMatch)
    storage.setMatches(mapped)
    return mapped
  },

  async getMatch(id: string | number): Promise<Match> {
    const response = await requestWithAuth(`${API_BASE}/matches/${id}`)
    if (!response.ok) throw new Error(`Match #${id} not found`)
    const data = await response.json()
    return mapBackendMatch(data)
  },

  async createMatch(payload: Record<string, unknown>): Promise<Match> {
    const response = await requestWithAuth(`${API_BASE}/matches`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to create match')
    }
    const data = await response.json()
    return mapBackendMatch(data)
  },

  async updateMatch(id: string | number, payload: Record<string, unknown>): Promise<Match> {
    const response = await requestWithAuth(`${API_BASE}/matches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to update match')
    }
    const data = await response.json()
    return mapBackendMatch(data)
  },

  async deleteMatch(id: string | number): Promise<void> {
    const response = await requestWithAuth(`${API_BASE}/matches/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Failed to delete match')
    }
  },

  // Leaderboards
  async getTeamLeaderboards(): Promise<LeaderboardTeam[]> {
    const response = await requestWithAuth(`${API_BASE}/leaderboards/teams`)
    if (!response.ok) throw new Error('Failed to fetch team leaderboards')
    const data: Array<{
      rank: number
      team_id: number
      name: string
      logo_url?: string | null
      points: number
      win_rate?: number
    }> = await response.json()
    return data.map((t) => ({
      rank: t.rank,
      teamId: t.team_id,
      name: t.name,
      logoUrl: t.logo_url || undefined,
      points: t.points,
      winRate: t.win_rate ?? 50,
    }))
  },

  async getPlayerLeaderboards(limit: number = 15): Promise<LeaderboardPlayer[]> {
    const response = await requestWithAuth(`${API_BASE}/leaderboards/players?limit=${limit}`)
    if (!response.ok) throw new Error('Failed to fetch player leaderboards')
    const data: Array<{
      rank: number
      player_id: number
      nickname: string
      team_name: string
      avatar_url?: string | null
      rating: number
      kd?: string | null
      adr?: number | null
    }> = await response.json()
    return data.map((p) => ({
      rank: p.rank,
      playerId: p.player_id,
      nickname: p.nickname,
      teamName: p.team_name,
      avatarUrl: p.avatar_url || undefined,
      rating: p.rating,
      kd: p.kd || '1.00',
      adr: p.adr ?? 80,
    }))
  },
}
