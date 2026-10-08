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
