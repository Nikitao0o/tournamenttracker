export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED'
export type TournamentStatus = 'Ongoing' | 'Upcoming' | 'Completed'
export type BracketType = 'double_elimination' | 'single_elimination' | 'round_robin' | 'swiss'

export type Match = {
  id: string
  teamA: string
  teamB: string
  scoreA?: number
  scoreB?: number
  status: MatchStatus
  tournamentId: string
  tournamentName: string
  date: string
  map?: string
}

export type Tournament = {
  id: string
  title: string
  prizePool: string
  startDate: string
  endDate: string
  status: TournamentStatus
  location: string
  bracketType?: BracketType | string
}

export type Team = {
  id: string
  name: string
  shortName: string
  region: string
  coach: string
  description: string
  ranking: number
  roster: string[]
}

export type Player = {
  id: string
  name: string
  age: number
  role: string
  nationality: string
  teamId: string
  teamName: string
  stats: {
    kd: string
    impact: number
    maps: number
  }
}

export type User = {
  id: number | string
  email: string
  nickname: string
  is_active: boolean
  created_at: string
  is_admin: boolean
  player_id?: number | string | null
}

export type AuthToken = {
  access_token: string
  token_type: string
  user: User
}

export type CreateTournamentInput = {
  title: string
  prizePool: string
  startDate: string
  endDate: string
  status: TournamentStatus
  location: string
  bracketType?: BracketType | string
}

export type UpdateTournamentInput = Partial<CreateTournamentInput>
