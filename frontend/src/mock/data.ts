import type { Match, Player, Team, Tournament, TournamentBracketView } from '../types'
import { storage } from '../shared/api/storage'
import { generateDynamicBracket } from '../features/bracket/utils/bracketGenerator'

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '101',
    title: 'PGL Major Copenhagen 2026',
    prizePool: '$1,250,000',
    startDate: '2026-03-17',
    endDate: '2026-03-31',
    status: 'Completed',
    location: 'Copenhagen, Denmark',
    bracketType: 'single_elimination',
    participatingTeams: ['Natus Vincere', 'FaZe', 'Spirit', 'Vitality'],
  },
  {
    id: '102',
    title: 'IEM Katowice 2026',
    prizePool: '$1,000,000',
    startDate: '2026-09-20',
    endDate: '2026-10-04',
    status: 'Ongoing',
    location: 'Katowice, Poland',
    bracketType: 'double_elimination',
    participatingTeams: ['Spirit', 'Vitality', 'FURIA', 'MOUZ', 'Falcons', 'Heroic', 'Astralis', 'G2'],
  },
  {
    id: '103',
    title: 'ESL Pro League Season 24',
    prizePool: '$850,000',
    startDate: '2026-10-12',
    endDate: '2026-11-02',
    status: 'Upcoming',
    location: 'Malta',
    bracketType: 'double_elimination',
    participatingTeams: ['Spirit', 'MOUZ', 'G2', 'FaZe'],
  },
  {
    id: '104',
    title: 'BLAST Premier Fall Final',
    prizePool: '$425,000',
    startDate: '2026-09-18',
    endDate: '2026-09-28',
    status: 'Ongoing',
    location: 'Copenhagen, Denmark',
    bracketType: 'single_elimination',
    participatingTeams: ['The MongolZ', 'Liquid', 'Spirit', 'Vitality'],
  },
]

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team-spirit',
    name: 'Team Spirit',
    shortName: 'Spirit',
    region: 'Europe',
    coach: 'Yuri "Yurii" Dvoryanov',
    description: 'A disciplined counter-strike roster with elite map control and exceptional mid-round composure.',
    ranking: 1,
    roster: ['donk', 'chopper', 'zont1x', 'magixx', 'sh1ro'],
    logoUrl: '/images/teams/team-spirit.png',
  },
  {
    id: 'team-vitality',
    name: 'Team Vitality',
    shortName: 'Vitality',
    region: 'Europe',
    coach: 'Dennis Mølleby',
    description: 'Known for explosive opening duels and a deep tactical pool that thrives in late-round scenarios.',
    ranking: 2,
    roster: ['apEX', 'ZywOo', 'magisk', 'mezii', 'ropz'],
    logoUrl: '/images/teams/team-vitality.jpg',
  },
  {
    id: 'team-furia',
    name: 'FURIA Esports',
    shortName: 'FURIA',
    region: 'Americas',
    coach: 'Anderson "Ande" Brum',
    description: 'Aggressive pressure game with a strong late-round economy and confident post-plant execution.',
    ranking: 3,
    roster: ['yuurih', 'KSCERATO', 'FalleN', 'saffee', 'arT'],
    logoUrl: '/images/teams/team-furia.png',
  },
  {
    id: 'team-mouz',
    name: 'MOUZ',
    shortName: 'MOUZ',
    region: 'Europe',
    coach: 'Alfie',
    description: 'A structured and efficient squad built around utility timing and consistent map momentum.',
    ranking: 4,
    roster: ['s1mple', 'xertioN', 'Jimpphat', 'torzsi', 'Brollan'],
    logoUrl: '/images/teams/team-mouz.jpg',
  },
]

export const MOCK_PLAYERS: Player[] = [
  { id: 'donk', name: 'Danil Kryshkovets', age: 19, role: 'Entry Fragger', nationality: 'Russian', teamId: 'team-spirit', teamName: 'Team Spirit', avatarUrl: '/images/players/donk.png', stats: { kd: '1.28', impact: 9.4, maps: 59 } },
  { id: 'chopper', name: 'Aleksandr Gorbunov', age: 23, role: 'IGL', nationality: 'Russian', teamId: 'team-spirit', teamName: 'Team Spirit', avatarUrl: '/images/players/chopper.jpg', stats: { kd: '1.15', impact: 8.8, maps: 61 } },
  { id: 'zont1x', name: 'Kirill Petrov', age: 21, role: 'Lurker', nationality: 'Russian', teamId: 'team-spirit', teamName: 'Team Spirit', avatarUrl: '/images/players/zont1x.png', stats: { kd: '1.12', impact: 8.7, maps: 58 } },
  { id: 'magixx', name: 'Dmitry Frolov', age: 20, role: 'Support', nationality: 'Russian', teamId: 'team-spirit', teamName: 'Team Spirit', avatarUrl: '/images/players/magixx.jpg', stats: { kd: '1.06', impact: 8.5, maps: 54 } },
  { id: 'sh1ro', name: 'Bogdan Naumov', age: 22, role: 'AWPer', nationality: 'Russian', teamId: 'team-spirit', teamName: 'Team Spirit', avatarUrl: '/images/players/sh1ro.png', stats: { kd: '1.23', impact: 9.0, maps: 62 } },
  { id: 'apEX', name: 'Mathieu Herbaut', age: 29, role: 'IGL', nationality: 'French', teamId: 'team-vitality', teamName: 'Team Vitality', avatarUrl: '/images/players/apex.jpg', stats: { kd: '1.10', impact: 8.6, maps: 77 } },
  { id: 'zywOo', name: 'Mathieu Herbaut', age: 24, role: 'AWPer', nationality: 'French', teamId: 'team-vitality', teamName: 'Team Vitality', avatarUrl: '/images/players/zywoo.png', stats: { kd: '1.47', impact: 9.8, maps: 88 } },
  { id: 'magisk', name: 'Emil Reif', age: 28, role: 'Entry Fragger', nationality: 'Danish', teamId: 'team-vitality', teamName: 'Team Vitality', avatarUrl: '/images/players/magisk.jpg', stats: { kd: '1.08', impact: 8.4, maps: 71 } },
  { id: 'mezii', name: 'Robin Manier', age: 23, role: 'Lurker', nationality: 'French', teamId: 'team-vitality', teamName: 'Team Vitality', avatarUrl: '/images/players/mezii.png', stats: { kd: '1.13', impact: 8.7, maps: 70 } },
  { id: 'ropz', name: 'Robin Kool', age: 25, role: 'Support', nationality: 'Estonian', teamId: 'team-vitality', teamName: 'Team Vitality', avatarUrl: '/images/players/ropz.jpg', stats: { kd: '1.17', impact: 8.9, maps: 73 } },
  { id: 'yuurih', name: 'Yuri Boian', age: 24, role: 'IGL', nationality: 'Brazilian', teamId: 'team-furia', teamName: 'FURIA Esports', avatarUrl: '/images/players/yuurih.jpg', stats: { kd: '1.04', impact: 8.1, maps: 69 } },
  { id: 'kscerato', name: 'Kaiky Santos', age: 20, role: 'Entry Fragger', nationality: 'Brazilian', teamId: 'team-furia', teamName: 'FURIA Esports', avatarUrl: '/images/players/kscerato.png', stats: { kd: '1.18', impact: 8.6, maps: 72 } },
  { id: 'fallen', name: 'Gabriel Toledo', age: 31, role: 'Support', nationality: 'Brazilian', teamId: 'team-furia', teamName: 'FURIA Esports', avatarUrl: '/images/players/fallen.jpg', stats: { kd: '1.11', impact: 8.5, maps: 79 } },
  { id: 'saffee', name: 'Rafael Costa', age: 24, role: 'AWPer', nationality: 'Brazilian', teamId: 'team-furia', teamName: 'FURIA Esports', avatarUrl: '/images/players/saffee.png', stats: { kd: '1.22', impact: 8.9, maps: 68 } },
  { id: 'art', name: 'André Abreu', age: 23, role: 'Lurker', nationality: 'Brazilian', teamId: 'team-furia', teamName: 'FURIA Esports', avatarUrl: '/images/players/art.jpg', stats: { kd: '1.09', impact: 8.3, maps: 66 } },
  { id: 's1mple', name: 'Oleksandr Kostyliev', age: 29, role: 'AWPer', nationality: 'Ukrainian', teamId: 'team-mouz', teamName: 'MOUZ', avatarUrl: '/images/players/s1mple.png', stats: { kd: '1.35', impact: 9.5, maps: 92 } },
  { id: 'xertion', name: 'Milan Kozomara', age: 24, role: 'Entry Fragger', nationality: 'Serbian', teamId: 'team-mouz', teamName: 'MOUZ', avatarUrl: '/images/players/xertion.jpg', stats: { kd: '1.12', impact: 8.4, maps: 59 } },
  { id: 'jimpphat', name: 'Kristian Klivanen', age: 22, role: 'Support', nationality: 'Finnish', teamId: 'team-mouz', teamName: 'MOUZ', avatarUrl: '/images/players/jimpphat.png', stats: { kd: '1.09', impact: 8.2, maps: 61 } },
  { id: 'torzsi', name: 'Ádám Kovács', age: 23, role: 'Lurker', nationality: 'Hungarian', teamId: 'team-mouz', teamName: 'MOUZ', avatarUrl: '/images/players/torzsi.jpg', stats: { kd: '1.18', impact: 8.7, maps: 63 } },
  { id: 'brollan', name: 'Nicolai Brock-Madsen', age: 27, role: 'IGL', nationality: 'Danish', teamId: 'team-mouz', teamName: 'MOUZ', avatarUrl: '/images/players/brollan.png', stats: { kd: '1.05', impact: 8.3, maps: 60 } },
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

export function getTeamById(id: string) {
  const teams = storage.getTeams() || MOCK_TEAMS
  return teams.find((team) => team.id === id)
}

export function getTeamByReference(reference: string) {
  const teams = storage.getTeams() || MOCK_TEAMS
  return teams.find(
    (team) =>
      team.id === reference ||
      getTeamSlug(team.name) === reference ||
      getTeamSlug(team.shortName) === reference,
  )
}

export function getPlayerById(id: string) {
  const players = storage.getPlayers() || MOCK_PLAYERS
  return players.find((player) => player.id === id)
}

export function getPlayersByTeamId(teamId: string) {
  const players = storage.getPlayers() || MOCK_PLAYERS
  return players.filter((player) => player.teamId === teamId)
}

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

export const MOCK_PLAYER_RANKINGS = [
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
  const customTeams = (storage.getTeams() || MOCK_TEAMS).map((t) => t.name)
  return [...new Set([...customTeams, ...MOCK_RANKING, ...MOCK_MATCHES.flatMap(({ teamA, teamB }) => [teamA, teamB])])]
}

export function getTeamBySlug(slug: string) {
  return getAllTeamNames().find((team) => getTeamSlug(team) === slug)
}

export function getMatchesByTeam(team: string) {
  return MOCK_MATCHES.filter((match) => match.teamA === team || match.teamB === team)
}

export function getMockBracketForTournament(
  tournament: Tournament | { id: string | number; title: string; bracketType?: string; participatingTeams?: string[] },
): TournamentBracketView {
  const bracketType = (tournament.bracketType || 'double_elimination').toLowerCase() === 'single_elimination'
    ? 'single_elimination'
    : 'double_elimination'
  const tourneyId = tournament.id
  const tourneyTitle = tournament.title
  const teams = tournament.participatingTeams ?? []

  return generateDynamicBracket(tourneyId, tourneyTitle, bracketType, teams)
}
