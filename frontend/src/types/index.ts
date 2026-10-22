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
  logoUrl?: string
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
  avatarUrl?: string
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

export type BracketMatch = {
  id: number | string
  status: MatchStatus | string
  scoreA?: number | null
  scoreB?: number | null
  date: string
  startTime?: string | null
  mapName?: string | null
  matchFormat?: string
  bracketType?: string | null
  roundName?: string | null
  roundOrder?: number | null
  teamAId?: number | null
  teamBId?: number | null
  teamAName: string
  teamBName: string
  teamALogoUrl?: string | null
  teamBLogoUrl?: string | null
  winnerId?: number | null
  winnerName?: string | null
  tournamentId: number | string
  tournamentName?: string | null
  nextMatchId?: number | null
  nextLoserMatchId?: number | null
}

export type BracketRoundGroup = {
  roundName: string
  roundOrder: number
  matches: BracketMatch[]
}

export type TournamentBracketView = {
  tournamentId: number | string
  tournamentTitle: string
  bracketType: BracketType | string
  upperBracket: BracketRoundGroup[]
  lowerBracket: BracketRoundGroup[]
  grandFinal?: BracketMatch | null
  allRounds: BracketRoundGroup[]
}
