export type BracketType =
  | 'double_elimination'
  | 'single_elimination'
  | 'round_robin'
  | 'swiss'

export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED'

export type TournamentStatus = 'Ongoing' | 'Upcoming' | 'Completed'

export type MapResult = {
  id: number
  matchId: number
  mapNumber: number
  mapName: string
  scoreA: number
  scoreB: number
  winnerId?: number | null
  winnerName?: string | null
}

export type PlayerMatchStat = {
  id: number
  matchId: number
  mapId?: number | null
  playerId: number
  playerNickname: string
  teamId: number
  teamName: string
  kills: number
  deaths: number
  assists: number
  headshots: number
  adr: number
  kast: number
  rating: number
  isMvp: boolean
}

export type Match = {
  id: string
  teamA: string
  teamB: string
  teamAId?: number | null
  teamBId?: number | null
  teamALogoUrl?: string | null
  teamBLogoUrl?: string | null
  scoreA?: number | null
  scoreB?: number | null
  status: MatchStatus
  tournamentId: string
  tournamentName?: string
  date: string
  startTime?: string | null
  map?: string | null
  mapName?: string | null
  matchFormat?: string
  bracketType?: BracketType | string
  roundName?: string | null
  roundOrder?: number | null
  winnerId?: number | null
  winnerName?: string | null
  nextMatchId?: string | number | null
  nextLoserMatchId?: string | number | null
  mapResults?: MapResult[]
  playerStats?: PlayerMatchStat[]
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
  ranking?: number
  roster: string[]
  logoUrl?: string | null
  points?: number
  winRate?: number
}

export type Player = {
  id: string
  nickname?: string
  name: string
  birthDate?: string
  age: number
  role: string
  nationality: string
  teamId: string
  teamName: string
  avatarUrl?: string | null
  stats: {
    kd: string
    impact: number
    maps: number
    adr?: number
    rating?: number
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
  avatar_url?: string | null
}

export type AuthToken = {
  access_token: string
  refresh_token?: string
  token_type: string
  user: User
}

export type MatchFormat = 'BO1' | 'BO3' | 'BO5'

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

export type CreateTeamInput = {
  name: string
  shortName: string
  region: string
  coach: string
  description: string
  ranking?: number
  roster?: string[]
  logoUrl?: string | null
}

export type CreatePlayerInput = {
  id?: string
  nickname?: string
  name: string
  birthDate?: string
  age?: number
  role: string
  nationality: string
  teamId?: string | null
  teamName?: string
  avatarUrl?: string | null
  kd?: string
  impact?: number
  maps?: number
  stats?: {
    kd: string
    impact: number
    maps: number
  }
}

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
  tournamentTitle?: string
  bracketType: BracketType | string
  upperBracket: BracketRoundGroup[]
  lowerBracket: BracketRoundGroup[]
  grandFinal?: BracketMatch | null
  allRounds: BracketRoundGroup[]
}

export type LeaderboardTeam = {
  rank: number
  teamId: number
  name: string
  logoUrl?: string | null
  points: number
  winRate: number
}

export type LeaderboardPlayer = {
  rank: number
  playerId: number
  nickname: string
  teamName: string
  avatarUrl?: string | null
  rating: number | null
  kd: string
  adr: number
}
