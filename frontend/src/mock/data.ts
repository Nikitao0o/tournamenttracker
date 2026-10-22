import type { BracketMatch, BracketRoundGroup, Match, Player, Team, Tournament, TournamentBracketView } from '../types'
import { TEAM_LOGOS } from '../shared/ui/teamLogosData'

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: '101',
    title: 'PGL Major Copenhagen 2026',
    prizePool: '$1,250,000',
    startDate: '2026-03-17',
    endDate: '2026-03-31',
    status: 'Completed',
    location: 'Copenhagen, Denmark',
    bracketType: 'swiss',
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
  },
  {
    id: '103',
    title: 'ESL Pro League Season 24',
    prizePool: '$850,000',
    startDate: '2026-10-12',
    endDate: '2026-11-02',
    status: 'Upcoming',
    location: 'Malta',
    bracketType: 'round_robin',
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
  return MOCK_TEAMS.find((team) => team.id === id)
}

export function getTeamByReference(reference: string) {
  return MOCK_TEAMS.find(
    (team) =>
      team.id === reference ||
      getTeamSlug(team.name) === reference ||
      getTeamSlug(team.shortName) === reference,
  )
}

export function getPlayerById(id: string) {
  return MOCK_PLAYERS.find((player) => player.id === id)
}

export function getPlayersByTeamId(teamId: string) {
  return MOCK_PLAYERS.filter((player) => player.teamId === teamId)
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
  return [...new Set([...MOCK_RANKING, ...MOCK_MATCHES.flatMap(({ teamA, teamB }) => [teamA, teamB])])]
}

export function getTeamBySlug(slug: string) {
  return getAllTeamNames().find((team) => getTeamSlug(team) === slug)
}

export function getMatchesByTeam(team: string) {
  return MOCK_MATCHES.filter((match) => match.teamA === team || match.teamB === team)
}

export function getMockBracketForTournament(tournament: Tournament | { id: string | number; title: string; bracketType?: string }): TournamentBracketView {
  const bracketType = (tournament.bracketType || 'double_elimination').toLowerCase()
  const tourneyId = tournament.id
  const tourneyTitle = tournament.title

  const spiritLogo = TEAM_LOGOS['team-spirit']?.svg || 'https://cdn.pandascore.co/images/team/image/125863/team_spirit.png'
  const vitalityLogo = TEAM_LOGOS['team-vitality']?.svg || 'https://cdn.pandascore.co/images/team/image/3216/vitality.png'
  const furiaLogo = TEAM_LOGOS['team-furia']?.svg || 'https://cdn.pandascore.co/images/team/image/124530/8297.png'
  const mouzLogo = TEAM_LOGOS['team-mouz']?.svg || 'https://cdn.pandascore.co/images/team/image/3250/mouz.png'

  if (bracketType === 'single_elimination') {
    const round1: BracketRoundGroup = {
      roundName: 'Semifinals',
      roundOrder: 1,
      matches: [
        {
          id: 1001,
          status: 'FINISHED',
          scoreA: 2,
          scoreB: 0,
          date: '2026-09-26',
          startTime: '17:00 Saturday',
          matchFormat: 'BO3',
          bracketType: 'single',
          roundName: 'Semifinals',
          roundOrder: 1,
          teamAId: 1,
          teamBId: 3,
          teamAName: 'Spirit',
          teamBName: 'FURIA',
          teamALogoUrl: spiritLogo,
          teamBLogoUrl: furiaLogo,
          winnerId: 1,
          winnerName: 'Spirit',
          tournamentId: tourneyId,
          tournamentName: tourneyTitle,
        },
        {
          id: 1002,
          status: 'FINISHED',
          scoreA: 2,
          scoreB: 1,
          date: '2026-09-26',
          startTime: '20:00 Saturday',
          matchFormat: 'BO3',
          bracketType: 'single',
          roundName: 'Semifinals',
          roundOrder: 1,
          teamAId: 2,
          teamBId: 4,
          teamAName: 'Vitality',
          teamBName: 'MOUZ',
          teamALogoUrl: vitalityLogo,
          teamBLogoUrl: mouzLogo,
          winnerId: 2,
          winnerName: 'Vitality',
          tournamentId: tourneyId,
          tournamentName: tourneyTitle,
        },
      ],
    }

    const grandFinal: BracketMatch = {
      id: 1003,
      status: 'FINISHED',
      scoreA: 1,
      scoreB: 2,
      date: '2026-09-28',
      startTime: '20:00 Sunday',
      matchFormat: 'BO3',
      bracketType: 'grand_final',
      roundName: 'Grand final',
      roundOrder: 2,
      teamAId: 1,
      teamBId: 2,
      teamAName: 'Spirit',
      teamBName: 'Vitality',
      teamALogoUrl: spiritLogo,
      teamBLogoUrl: vitalityLogo,
      winnerId: 2,
      winnerName: 'Vitality',
      tournamentId: tourneyId,
      tournamentName: tourneyTitle,
    }

    return {
      tournamentId: tourneyId,
      tournamentTitle: tourneyTitle,
      bracketType: 'single_elimination',
      upperBracket: [round1],
      lowerBracket: [],
      grandFinal,
      allRounds: [round1],
    }
  }

  if (bracketType === 'round_robin') {
    const rounds: BracketRoundGroup[] = [
      {
        roundName: 'Round 1',
        roundOrder: 1,
        matches: [
          {
            id: 2001,
            status: 'FINISHED',
            scoreA: 2,
            scoreB: 0,
            date: '2026-10-14',
            startTime: '15:00 Wednesday',
            matchFormat: 'BO3',
            bracketType: 'round_robin',
            roundName: 'Round 1',
            roundOrder: 1,
            teamAId: 1,
            teamBId: 3,
            teamAName: 'Spirit',
            teamBName: 'FURIA',
            teamALogoUrl: spiritLogo,
            teamBLogoUrl: furiaLogo,
            winnerId: 1,
            winnerName: 'Spirit',
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
          {
            id: 2002,
            status: 'FINISHED',
            scoreA: 2,
            scoreB: 1,
            date: '2026-10-14',
            startTime: '18:30 Wednesday',
            matchFormat: 'BO3',
            bracketType: 'round_robin',
            roundName: 'Round 1',
            roundOrder: 1,
            teamAId: 2,
            teamBId: 4,
            teamAName: 'Vitality',
            teamBName: 'MOUZ',
            teamALogoUrl: vitalityLogo,
            teamBLogoUrl: mouzLogo,
            winnerId: 2,
            winnerName: 'Vitality',
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
        ],
      },
      {
        roundName: 'Round 2',
        roundOrder: 2,
        matches: [
          {
            id: 2003,
            status: 'FINISHED',
            scoreA: 2,
            scoreB: 1,
            date: '2026-10-16',
            startTime: '16:00 Friday',
            matchFormat: 'BO3',
            bracketType: 'round_robin',
            roundName: 'Round 2',
            roundOrder: 2,
            teamAId: 1,
            teamBId: 2,
            teamAName: 'Spirit',
            teamBName: 'Vitality',
            teamALogoUrl: spiritLogo,
            teamBLogoUrl: vitalityLogo,
            winnerId: 1,
            winnerName: 'Spirit',
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
          {
            id: 2004,
            status: 'FINISHED',
            scoreA: 0,
            scoreB: 2,
            date: '2026-10-16',
            startTime: '19:30 Friday',
            matchFormat: 'BO3',
            bracketType: 'round_robin',
            roundName: 'Round 2',
            roundOrder: 2,
            teamAId: 3,
            teamBId: 4,
            teamAName: 'FURIA',
            teamBName: 'MOUZ',
            teamALogoUrl: furiaLogo,
            teamBLogoUrl: mouzLogo,
            winnerId: 4,
            winnerName: 'MOUZ',
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
        ],
      },
      {
        roundName: 'Round 3',
        roundOrder: 3,
        matches: [
          {
            id: 2005,
            status: 'UPCOMING',
            scoreA: null,
            scoreB: null,
            date: '2026-10-18',
            startTime: '16:00 Sunday',
            matchFormat: 'BO3',
            bracketType: 'round_robin',
            roundName: 'Round 3',
            roundOrder: 3,
            teamAId: 1,
            teamBId: 4,
            teamAName: 'Spirit',
            teamBName: 'MOUZ',
            teamALogoUrl: spiritLogo,
            teamBLogoUrl: mouzLogo,
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
          {
            id: 2006,
            status: 'UPCOMING',
            scoreA: null,
            scoreB: null,
            date: '2026-10-18',
            startTime: '19:30 Sunday',
            matchFormat: 'BO3',
            bracketType: 'round_robin',
            roundName: 'Round 3',
            roundOrder: 3,
            teamAId: 2,
            teamBId: 3,
            teamAName: 'Vitality',
            teamBName: 'FURIA',
            teamALogoUrl: vitalityLogo,
            teamBLogoUrl: furiaLogo,
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
        ],
      },
    ]

    return {
      tournamentId: tourneyId,
      tournamentTitle: tourneyTitle,
      bracketType: 'round_robin',
      upperBracket: [],
      lowerBracket: [],
      grandFinal: null,
      allRounds: rounds,
    }
  }

  if (bracketType === 'swiss') {
    const rounds: BracketRoundGroup[] = [
      {
        roundName: 'Swiss Round 1 (0-0 Record)',
        roundOrder: 1,
        matches: [
          {
            id: 3001,
            status: 'FINISHED',
            scoreA: 13,
            scoreB: 9,
            date: '2026-03-18',
            startTime: '13:00 Wednesday',
            matchFormat: 'BO1',
            bracketType: 'swiss',
            roundName: 'Swiss Round 1',
            roundOrder: 1,
            teamAId: 1,
            teamBId: 4,
            teamAName: 'Spirit',
            teamBName: 'MOUZ',
            teamALogoUrl: spiritLogo,
            teamBLogoUrl: mouzLogo,
            winnerId: 1,
            winnerName: 'Spirit',
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
          {
            id: 3002,
            status: 'FINISHED',
            scoreA: 13,
            scoreB: 8,
            date: '2026-03-18',
            startTime: '14:30 Wednesday',
            matchFormat: 'BO1',
            bracketType: 'swiss',
            roundName: 'Swiss Round 1',
            roundOrder: 1,
            teamAId: 2,
            teamBId: 3,
            teamAName: 'Vitality',
            teamBName: 'FURIA',
            teamALogoUrl: vitalityLogo,
            teamBLogoUrl: furiaLogo,
            winnerId: 2,
            winnerName: 'Vitality',
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
        ],
      },
      {
        roundName: 'Swiss Round 2 (1-0 & 0-1 Pools)',
        roundOrder: 2,
        matches: [
          {
            id: 3003,
            status: 'LIVE',
            scoreA: 11,
            scoreB: 10,
            date: '2026-03-19',
            startTime: '17:00 Thursday (1-0 Pool)',
            matchFormat: 'BO3',
            bracketType: 'swiss',
            roundName: 'Swiss Round 2 (High Pool)',
            roundOrder: 2,
            teamAId: 1,
            teamBId: 2,
            teamAName: 'Spirit',
            teamBName: 'Vitality',
            teamALogoUrl: spiritLogo,
            teamBLogoUrl: vitalityLogo,
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
          {
            id: 3004,
            status: 'UPCOMING',
            scoreA: null,
            scoreB: null,
            date: '2026-03-19',
            startTime: '20:30 Thursday (0-1 Pool)',
            matchFormat: 'BO3',
            bracketType: 'swiss',
            roundName: 'Swiss Round 2 (Low Pool)',
            roundOrder: 2,
            teamAId: 3,
            teamBId: 4,
            teamAName: 'FURIA',
            teamBName: 'MOUZ',
            teamALogoUrl: furiaLogo,
            teamBLogoUrl: mouzLogo,
            tournamentId: tourneyId,
            tournamentName: tourneyTitle,
          },
        ],
      },
    ]

    return {
      tournamentId: tourneyId,
      tournamentTitle: tourneyTitle,
      bracketType: 'swiss',
      upperBracket: [],
      lowerBracket: [],
      grandFinal: null,
      allRounds: rounds,
    }
  }

  // Default: DOUBLE ELIMINATION (IEM Katowice style)
  const openingRound: BracketRoundGroup = {
    roundName: 'Opening round',
    roundOrder: 1,
    matches: [
      {
        id: 4001,
        status: 'FINISHED',
        scoreA: 2,
        scoreB: 0,
        date: '2026-10-02',
        startTime: '21:00 Friday',
        matchFormat: 'BO3',
        bracketType: 'upper',
        roundName: 'Opening round',
        roundOrder: 1,
        teamAId: 1,
        teamBId: 4,
        teamAName: 'Spirit',
        teamBName: 'MOUZ',
        teamALogoUrl: spiritLogo,
        teamBLogoUrl: mouzLogo,
        winnerId: 1,
        winnerName: 'Spirit',
        tournamentId: tourneyId,
        tournamentName: tourneyTitle,
      },
      {
        id: 4002,
        status: 'FINISHED',
        scoreA: 2,
        scoreB: 1,
        date: '2026-10-02',
        startTime: '00:00 Saturday',
        matchFormat: 'BO3',
        bracketType: 'upper',
        roundName: 'Opening round',
        roundOrder: 1,
        teamAId: 2,
        teamBId: 3,
        teamAName: 'Vitality',
        teamBName: 'FURIA',
        teamALogoUrl: vitalityLogo,
        teamBLogoUrl: furiaLogo,
        winnerId: 2,
        winnerName: 'Vitality',
        tournamentId: tourneyId,
        tournamentName: tourneyTitle,
      },
    ],
  }

  const upperFinal: BracketRoundGroup = {
    roundName: 'Upper final',
    roundOrder: 2,
    matches: [
      {
        id: 4003,
        status: 'UPCOMING',
        scoreA: null,
        scoreB: null,
        date: '2026-10-03',
        startTime: '00:00 Sunday',
        matchFormat: 'BO3',
        bracketType: 'upper',
        roundName: 'Upper final',
        roundOrder: 2,
        teamAId: 1,
        teamBId: 2,
        teamAName: 'Spirit',
        teamBName: 'Vitality',
        teamALogoUrl: spiritLogo,
        teamBLogoUrl: vitalityLogo,
        tournamentId: tourneyId,
        tournamentName: tourneyTitle,
      },
    ],
  }

  const lowerFinal: BracketRoundGroup = {
    roundName: 'Lower final',
    roundOrder: 2,
    matches: [
      {
        id: 4004,
        status: 'LIVE',
        scoreA: 1,
        scoreB: 1,
        date: '2026-10-02',
        startTime: '21:00 Saturday',
        matchFormat: 'BO3',
        bracketType: 'lower',
        roundName: 'Lower final',
        roundOrder: 2,
        teamAId: 4,
        teamBId: 3,
        teamAName: 'MOUZ',
        teamBName: 'FURIA',
        teamALogoUrl: mouzLogo,
        teamBLogoUrl: furiaLogo,
        tournamentId: tourneyId,
        tournamentName: tourneyTitle,
      },
    ],
  }

  const consolidationFinal: BracketRoundGroup = {
    roundName: 'Consolidation final',
    roundOrder: 3,
    matches: [
      {
        id: 4005,
        status: 'UPCOMING',
        scoreA: null,
        scoreB: null,
        date: '2026-10-03',
        startTime: '22:00 Sunday',
        matchFormat: 'BO3',
        bracketType: 'lower',
        roundName: 'Consolidation final',
        roundOrder: 3,
        teamAName: 'Loser of Upper Final',
        teamBName: 'Winner of Lower Final',
        tournamentId: tourneyId,
        tournamentName: tourneyTitle,
      },
    ],
  }

  const grandFinal: BracketMatch = {
    id: 4006,
    status: 'UPCOMING',
    scoreA: null,
    scoreB: null,
    date: '2026-10-04',
    startTime: '01:00 Monday',
    matchFormat: 'BO3',
    bracketType: 'grand_final',
    roundName: 'Grand final',
    roundOrder: 4,
    teamAName: 'Upper Bracket Winner',
    teamBName: 'Consolidation Winner',
    tournamentId: tourneyId,
    tournamentName: tourneyTitle,
  }

  return {
    tournamentId: tourneyId,
    tournamentTitle: tourneyTitle,
    bracketType: 'double_elimination',
    upperBracket: [openingRound, upperFinal],
    lowerBracket: [lowerFinal, consolidationFinal],
    grandFinal,
    allRounds: [openingRound, upperFinal, lowerFinal, consolidationFinal],
  }
}
