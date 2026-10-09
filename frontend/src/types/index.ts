export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED'
export type TournamentStatus = 'Ongoing' | 'Upcoming' | 'Completed'

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
