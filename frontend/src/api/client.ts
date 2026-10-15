import type { Match, Player, Team, Tournament } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

type ApiTeam = {
  id: number
  name: string
  short_name: string
  region: string
  coach: string
  description: string
  ranking: number
}

type ApiPlayer = {
  id: number
  nickname: string
  name: string
  age: number
  role: string
  nationality: string
  kd: string
  impact: number
  maps: number
  team_id: number
  team_name: string | null
}

type ApiTournament = {
  id: number
  title: string
  prize_pool: string
  start_date: string
  end_date: string
  status: string
  location: string
}

type ApiMatch = {
  id: number
  status: string
  score_a: number | null
  score_b: number | null
  date: string
  map_name: string | null
  team_a_id: number
  team_b_id: number
  tournament_id: number
  team_a_name: string | null
  team_b_name: string | null
  tournament_name: string | null
}

type ApiTeamLeaderboardEntry = {
  rank: number
  team_id: number
  name: string
}

type ApiPlayerLeaderboardEntry = {
  rank: number
  player_id: number
  nickname: string
  team_name: string
  rating: number
}

export type TeamLeaderboardEntry = {
  rank: number
  teamId: string
  name: string
}

export type PlayerLeaderboardEntry = {
  rank: number
  playerId: string
  nickname: string
  teamName: string
  rating: number
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `API request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

function toTeam(team: ApiTeam): Team {
  return {
    id: String(team.id),
    name: team.name,
    shortName: team.short_name,
    region: team.region,
    coach: team.coach,
    description: team.description,
    ranking: team.ranking,
    roster: [],
  }
}

function toPlayer(player: ApiPlayer): Player {
  return {
    id: String(player.id),
    name: player.name,
    age: player.age,
    role: player.role,
    nationality: player.nationality,
    teamId: String(player.team_id),
    teamName: player.team_name ?? 'Unknown team',
    stats: { kd: player.kd, impact: player.impact, maps: player.maps },
  }
}

function toTournament(tournament: ApiTournament): Tournament {
  return {
    id: String(tournament.id),
    title: tournament.title,
    prizePool: tournament.prize_pool,
    startDate: tournament.start_date,
    endDate: tournament.end_date,
    status: tournament.status as Tournament['status'],
    location: tournament.location,
  }
}

function toMatch(match: ApiMatch): Match {
  return {
    id: String(match.id),
    teamA: match.team_a_name ?? `Team ${match.team_a_id}`,
    teamB: match.team_b_name ?? `Team ${match.team_b_id}`,
    teamAId: String(match.team_a_id),
    teamBId: String(match.team_b_id),
    scoreA: match.score_a ?? undefined,
    scoreB: match.score_b ?? undefined,
    status: match.status as Match['status'],
    tournamentId: String(match.tournament_id),
    tournamentName: match.tournament_name ?? 'Tournament',
    date: match.date,
    map: match.map_name ?? undefined,
  }
}

export function getTeamSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function getTeams(): Promise<Team[]> {
  const teams = await request<ApiTeam[]>('/api/teams')
  return teams.map(toTeam)
}

export async function getTeamsWithRosters(): Promise<Team[]> {
  const [teams, players] = await Promise.all([
    request<ApiTeam[]>('/api/teams'),
    request<ApiPlayer[]>('/api/players'),
  ])
  return teams.map((team) => ({
    ...toTeam(team),
    roster: players.filter((player) => player.team_id === team.id).map((player) => player.nickname),
  }))
}

export async function getTeamByReference(reference: string): Promise<Team | undefined> {
  const teams = await getTeams()
  const team = teams.find(
    (entry) => entry.id === reference || getTeamSlug(entry.name) === reference ||
      getTeamSlug(entry.shortName) === reference,
  )
  return team
}

export async function getTeamPlayers(teamId: string): Promise<Player[]> {
  const players = await request<ApiPlayer[]>(`/api/teams/${teamId}/players`)
  return players.map(toPlayer)
}

export async function getPlayers(): Promise<Player[]> {
  const players = await request<ApiPlayer[]>('/api/players')
  return players.map(toPlayer)
}

export async function getPlayer(id: string): Promise<Player> {
  const player = await request<ApiPlayer>(`/api/players/${id}`)
  return toPlayer(player)
}

export async function getTournaments(): Promise<Tournament[]> {
  const tournaments = await request<ApiTournament[]>('/api/tournaments')
  return tournaments.map(toTournament)
}

export async function getTournament(id: string): Promise<Tournament> {
  const tournament = await request<ApiTournament>(`/api/tournaments/${id}`)
  return toTournament(tournament)
}

export async function getMatches(tournamentId?: string): Promise<Match[]> {
  const query = tournamentId ? `?tournament_id=${encodeURIComponent(tournamentId)}` : ''
  const matches = await request<ApiMatch[]>(`/api/matches${query}`)
  return matches.map(toMatch)
}

export async function getMatch(id: string): Promise<Match> {
  const match = await request<ApiMatch>(`/api/matches/${id}`)
  return toMatch(match)
}

export async function getTeamLeaderboard(): Promise<TeamLeaderboardEntry[]> {
  const entries = await request<ApiTeamLeaderboardEntry[]>('/api/leaderboards/teams')
  return entries.map((entry) => ({
    rank: entry.rank,
    teamId: String(entry.team_id),
    name: entry.name,
  }))
}

export async function getPlayerLeaderboard(): Promise<PlayerLeaderboardEntry[]> {
  const entries = await request<ApiPlayerLeaderboardEntry[]>('/api/leaderboards/players')
  return entries.map((entry) => ({
    rank: entry.rank,
    playerId: String(entry.player_id),
    nickname: entry.nickname,
    teamName: entry.team_name,
    rating: entry.rating,
  }))
}
