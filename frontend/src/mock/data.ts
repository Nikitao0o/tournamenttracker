import type { Match, Tournament } from '../types'

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '101',
    title: 'PGL Major Copenhagen 2026',
    prizePool: '$1,250,000',
    startDate: '2026-03-17',
    endDate: '2026-03-31',
    status: 'Completed',
    location: 'Copenhagen, Denmark',
  },
  {
    id: '102',
    title: 'IEM Katowice 2026',
    prizePool: '$1,000,000',
    startDate: '2026-09-20',
    endDate: '2026-10-04',
    status: 'Ongoing',
    location: 'Katowice, Poland',
  },
  {
    id: '103',
    title: 'ESL Pro League Season 24',
    prizePool: '$850,000',
    startDate: '2026-10-12',
    endDate: '2026-11-02',
    status: 'Upcoming',
    location: 'Malta',
  },
  {
    id: '104',
    title: 'BLAST Premier Fall Final',
    prizePool: '$425,000',
    startDate: '2026-09-18',
    endDate: '2026-09-28',
    status: 'Ongoing',
    location: 'Copenhagen, Denmark',
  },
]

export const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    teamA: 'Natus Vincere',
    teamB: 'FaZe',
    scoreA: 2,
    scoreB: 1,
    status: 'FINISHED',
    tournamentId: '101',
    tournamentName: 'PGL Major Copenhagen 2026',
    date: '2026-03-30',
    map: 'Inferno',
  },
  {
    id: '2',
    teamA: 'Vitality',
    teamB: 'G2',
    scoreA: 1,
    scoreB: 0,
    status: 'LIVE',
    tournamentId: '102',
    tournamentName: 'IEM Katowice 2026',
    date: '2026-10-02',
    map: 'Mirage',
  },
  {
    id: '3',
    teamA: 'Spirit',
    teamB: 'MOUZ',
    status: 'UPCOMING',
    tournamentId: '103',
    tournamentName: 'ESL Pro League Season 24',
    date: '2026-10-14',
  },
  {
    id: '4',
    teamA: 'The MongolZ',
    teamB: 'Liquid',
    scoreA: 12,
    scoreB: 9,
    status: 'LIVE',
    tournamentId: '104',
    tournamentName: 'BLAST Premier Fall Final',
    date: '2026-10-02',
    map: 'Ancient',
  },
  {
    id: '5',
    teamA: 'FURIA',
    teamB: 'Astralis',
    scoreA: 2,
    scoreB: 0,
    status: 'FINISHED',
    tournamentId: '102',
    tournamentName: 'IEM Katowice 2026',
    date: '2026-09-28',
    map: 'Nuke',
  },
  {
    id: '6',
    teamA: 'Falcons',
    teamB: 'Heroic',
    status: 'UPCOMING',
    tournamentId: '102',
    tournamentName: 'IEM Katowice 2026',
    date: '2026-10-03',
  },
  {
    id: '7',
    teamA: 'Spirit',
    teamB: 'Vitality',
    scoreA: 1,
    scoreB: 2,
    status: 'FINISHED',
    tournamentId: '104',
    tournamentName: 'BLAST Premier Fall Final',
    date: '2026-09-27',
    map: 'Dust2',
  },
  {
    id: '8',
    teamA: 'G2',
    teamB: 'FaZe',
    status: 'UPCOMING',
    tournamentId: '103',
    tournamentName: 'ESL Pro League Season 24',
    date: '2026-10-15',
  },
]

export function getMatchById(id: string) {
  return MOCK_MATCHES.find((match) => match.id === id)
}

export function getTournamentById(id: string) {
  return MOCK_TOURNAMENTS.find((tournament) => tournament.id === id)
}

export function getMatchesByTournamentId(tournamentId: string) {
  return MOCK_MATCHES.filter((match) => match.tournamentId === tournamentId)
}

export const MOCK_RANKING = [
  'Spirit',
  'Vitality',
  'FURIA',
  'MOUZ',
  'Falcons',
  'The MongolZ',
  'Natus Vincere',
  'G2',
  'Liquid',
  'FaZe',
]

export const MOCK_PLAYERS = [
  { name: 'donk', team: 'Spirit', rating: 1.32 },
  { name: 'ZywOo', team: 'Vitality', rating: 1.29 },
  { name: 'm0NESY', team: 'Falcons', rating: 1.24 },
  { name: 'sh1ro', team: 'Spirit', rating: 1.21 },
  { name: 'ropz', team: 'Vitality', rating: 1.18 },
  { name: 'frozen', team: 'FaZe', rating: 1.16 },
  { name: 'NiKo', team: 'Falcons', rating: 1.14 },
  { name: 'iM', team: 'Natus Vincere', rating: 1.12 },
  { name: 'KSCERATO', team: 'FURIA', rating: 1.1 },
  { name: 'xertioN', team: 'MOUZ', rating: 1.08 },
]

export function getTeamSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getAllTeamNames() {
  return [...new Set([...MOCK_RANKING, ...MOCK_MATCHES.flatMap(({ teamA, teamB }) => [teamA, teamB])])]
}

export function getTeamBySlug(slug: string) {
  return getAllTeamNames().find((team) => getTeamSlug(team) === slug)
}

export function getMatchesByTeam(team: string) {
  return MOCK_MATCHES.filter((match) => match.teamA === team || match.teamB === team)
}
