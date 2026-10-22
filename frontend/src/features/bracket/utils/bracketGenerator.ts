import type { BracketMatch, BracketRoundGroup, BracketType, TournamentBracketView } from '../../../types'
import { TEAM_LOGOS } from '../../../shared/ui/teamLogosData'
import { storage } from '../../../shared/api/storage'

function getSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getTeamLogoUrl(teamName?: string): string | undefined {
  if (!teamName || teamName === 'TBD' || teamName === 'Unassigned') return undefined
  const custom = storage.getTeamLogo(teamName)
  if (custom) return custom
  const slug = getSlug(teamName)
  const known = TEAM_LOGOS[`team-${slug}`]?.svg
  if (known) return known
  const foundTeam = (storage.getTeams() || []).find((t) => t.name.toLowerCase() === teamName.toLowerCase())
  return foundTeam?.logoUrl
}

function createMatch(
  id: number | string,
  roundName: string,
  roundOrder: number,
  teamAName: string,
  teamBName: string,
  tournamentId: string | number,
  tournamentTitle: string,
  bracketType: string = 'single',
): BracketMatch {
  const isA_TBD = !teamAName || teamAName === 'TBD'
  const isB_TBD = !teamBName || teamBName === 'TBD'

  return {
    id,
    status: isA_TBD && isB_TBD ? 'UPCOMING' : 'UPCOMING',
    scoreA: 0,
    scoreB: 0,
    date: new Date().toISOString().slice(0, 10),
    startTime: '18:00',
    matchFormat: 'BO3',
    bracketType,
    roundName,
    roundOrder,
    teamAId: isA_TBD ? null : 1,
    teamBId: isB_TBD ? null : 2,
    teamAName: isA_TBD ? 'TBD' : teamAName,
    teamBName: isB_TBD ? 'TBD' : teamBName,
    teamALogoUrl: getTeamLogoUrl(teamAName),
    teamBLogoUrl: getTeamLogoUrl(teamBName),
    winnerId: null,
    winnerName: null,
    tournamentId,
    tournamentName: tournamentTitle,
  }
}

export function generateDynamicBracket(
  tournamentId: string | number,
  tournamentTitle: string,
  bracketType: BracketType,
  teams: string[],
): TournamentBracketView {
  const count = teams.length
  const tId = tournamentId
  const title = tournamentTitle

  if (bracketType === 'single_elimination') {
    // 0-2 teams: 1 empty Final match
    if (count <= 2) {
      const grandFinal = createMatch(
        1001,
        'Final',
        1,
        teams[0] || 'TBD',
        teams[1] || 'TBD',
        tId,
        title,
        'grand_final',
      )

      return {
        tournamentId: tId,
        tournamentTitle: title,
        bracketType: 'single_elimination',
        upperBracket: [],
        lowerBracket: [],
        grandFinal,
        allRounds: [],
      }
    }

    // 3-4 teams: Semifinals (2 matches) + Final (1 match)
    if (count <= 4) {
      const sfGroup: BracketRoundGroup = {
        roundName: 'Semifinals',
        roundOrder: 1,
        matches: [
          createMatch(1001, 'Semifinals', 1, teams[0] || 'TBD', teams[1] || 'TBD', tId, title, 'single'),
          createMatch(1002, 'Semifinals', 1, teams[2] || 'TBD', teams[3] || 'TBD', tId, title, 'single'),
        ],
      }

      const grandFinal = createMatch(1003, 'Grand final', 2, 'TBD', 'TBD', tId, title, 'grand_final')

      return {
        tournamentId: tId,
        tournamentTitle: title,
        bracketType: 'single_elimination',
        upperBracket: [sfGroup],
        lowerBracket: [],
        grandFinal,
        allRounds: [sfGroup],
      }
    }

    // 5-8 teams: Quarterfinals (4 matches) + Semifinals (2 matches) + Final (1 match)
    if (count <= 8) {
      const qfGroup: BracketRoundGroup = {
        roundName: 'Quarterfinals',
        roundOrder: 1,
        matches: [
          createMatch(1001, 'Quarterfinals', 1, teams[0] || 'TBD', teams[1] || 'TBD', tId, title, 'single'),
          createMatch(1002, 'Quarterfinals', 1, teams[2] || 'TBD', teams[3] || 'TBD', tId, title, 'single'),
          createMatch(1003, 'Quarterfinals', 1, teams[4] || 'TBD', teams[5] || 'TBD', tId, title, 'single'),
          createMatch(1004, 'Quarterfinals', 1, teams[6] || 'TBD', teams[7] || 'TBD', tId, title, 'single'),
        ],
      }

      const sfGroup: BracketRoundGroup = {
        roundName: 'Semifinals',
        roundOrder: 2,
        matches: [
          createMatch(1005, 'Semifinals', 2, 'TBD', 'TBD', tId, title, 'single'),
          createMatch(1006, 'Semifinals', 2, 'TBD', 'TBD', tId, title, 'single'),
        ],
      }

      const grandFinal = createMatch(1007, 'Grand final', 3, 'TBD', 'TBD', tId, title, 'grand_final')

      return {
        tournamentId: tId,
        tournamentTitle: title,
        bracketType: 'single_elimination',
        upperBracket: [qfGroup, sfGroup],
        lowerBracket: [],
        grandFinal,
        allRounds: [qfGroup, sfGroup],
      }
    }

    // 9-16 teams: Round of 16 (8 matches) -> QF (4 matches) -> SF (2 matches) -> Final (1 match)
    const r16Matches: BracketMatch[] = []
    for (let i = 0; i < 8; i++) {
      r16Matches.push(
        createMatch(1000 + i + 1, 'Round of 16', 1, teams[i * 2] || 'TBD', teams[i * 2 + 1] || 'TBD', tId, title, 'single'),
      )
    }

    const r16Group: BracketRoundGroup = { roundName: 'Round of 16', roundOrder: 1, matches: r16Matches }
    const qfGroup: BracketRoundGroup = {
      roundName: 'Quarterfinals',
      roundOrder: 2,
      matches: [
        createMatch(1009, 'Quarterfinals', 2, 'TBD', 'TBD', tId, title, 'single'),
        createMatch(1010, 'Quarterfinals', 2, 'TBD', 'TBD', tId, title, 'single'),
        createMatch(1011, 'Quarterfinals', 2, 'TBD', 'TBD', tId, title, 'single'),
        createMatch(1012, 'Quarterfinals', 2, 'TBD', 'TBD', tId, title, 'single'),
      ],
    }
    const sfGroup: BracketRoundGroup = {
      roundName: 'Semifinals',
      roundOrder: 3,
      matches: [
        createMatch(1013, 'Semifinals', 3, 'TBD', 'TBD', tId, title, 'single'),
        createMatch(1014, 'Semifinals', 3, 'TBD', 'TBD', tId, title, 'single'),
      ],
    }
    const grandFinal = createMatch(1015, 'Grand final', 4, 'TBD', 'TBD', tId, title, 'grand_final')

    return {
      tournamentId: tId,
      tournamentTitle: title,
      bracketType: 'single_elimination',
      upperBracket: [r16Group, qfGroup, sfGroup],
      lowerBracket: [],
      grandFinal,
      allRounds: [r16Group, qfGroup, sfGroup],
    }
  }

  // DOUBLE ELIMINATION
  // 0-2 teams: 1 empty Final match
  if (count <= 2) {
    const grandFinal = createMatch(
      1001,
      'Final',
      1,
      teams[0] || 'TBD',
      teams[1] || 'TBD',
      tId,
      title,
      'grand_final',
    )

    return {
      tournamentId: tId,
      tournamentTitle: title,
      bracketType: 'double_elimination',
      upperBracket: [],
      lowerBracket: [],
      grandFinal,
      allRounds: [],
    }
  }

  // 3-4 teams: Upper Semifinals (2 matches) + Upper Final (1 match), Lower R1 (1 match) + Lower Final (1 match), Grand Final (1 match)
  if (count <= 4) {
    const upperSemis: BracketRoundGroup = {
      roundName: 'Upper Semifinals',
      roundOrder: 1,
      matches: [
        createMatch(2001, 'Upper Semifinals', 1, teams[0] || 'TBD', teams[1] || 'TBD', tId, title, 'upper'),
        createMatch(2002, 'Upper Semifinals', 1, teams[2] || 'TBD', teams[3] || 'TBD', tId, title, 'upper'),
      ],
    }
    const upperFinal: BracketRoundGroup = {
      roundName: 'Upper Final',
      roundOrder: 2,
      matches: [createMatch(2003, 'Upper Final', 2, 'TBD', 'TBD', tId, title, 'upper')],
    }

    const lowerFinal: BracketRoundGroup = {
      roundName: 'Lower Final',
      roundOrder: 2,
      matches: [createMatch(2004, 'Lower Final', 2, 'TBD', 'TBD', tId, title, 'lower')],
    }

    const grandFinal = createMatch(2005, 'Grand final', 3, 'TBD', 'TBD', tId, title, 'grand_final')

    return {
      tournamentId: tId,
      tournamentTitle: title,
      bracketType: 'double_elimination',
      upperBracket: [upperSemis, upperFinal],
      lowerBracket: [lowerFinal],
      grandFinal,
      allRounds: [upperSemis, upperFinal, lowerFinal],
    }
  }

  // 5-8 teams: Upper QF (4 matches) -> Upper SF (2 matches) -> Upper Final (1 match)
  // Lower R1 (2 matches) -> Lower QF (2 matches) -> Lower SF (1 match) -> Lower Final (1 match)
  // Grand Final (1 match)
  const upperQF: BracketRoundGroup = {
    roundName: 'Upper Quarterfinals',
    roundOrder: 1,
    matches: [
      createMatch(2001, 'Upper Quarterfinals', 1, teams[0] || 'TBD', teams[1] || 'TBD', tId, title, 'upper'),
      createMatch(2002, 'Upper Quarterfinals', 1, teams[2] || 'TBD', teams[3] || 'TBD', tId, title, 'upper'),
      createMatch(2003, 'Upper Quarterfinals', 1, teams[4] || 'TBD', teams[5] || 'TBD', tId, title, 'upper'),
      createMatch(2004, 'Upper Quarterfinals', 1, teams[6] || 'TBD', teams[7] || 'TBD', tId, title, 'upper'),
    ],
  }
  const upperSF: BracketRoundGroup = {
    roundName: 'Upper Semifinals',
    roundOrder: 2,
    matches: [
      createMatch(2005, 'Upper Semifinals', 2, 'TBD', 'TBD', tId, title, 'upper'),
      createMatch(2006, 'Upper Semifinals', 2, 'TBD', 'TBD', tId, title, 'upper'),
    ],
  }
  const upperFinal: BracketRoundGroup = {
    roundName: 'Upper Final',
    roundOrder: 3,
    matches: [createMatch(2007, 'Upper Final', 3, 'TBD', 'TBD', tId, title, 'upper')],
  }

  const lowerR1: BracketRoundGroup = {
    roundName: 'Lower Round 1',
    roundOrder: 1,
    matches: [
      createMatch(2008, 'Lower Round 1', 1, 'TBD', 'TBD', tId, title, 'lower'),
      createMatch(2009, 'Lower Round 1', 1, 'TBD', 'TBD', tId, title, 'lower'),
    ],
  }
  const lowerFinal: BracketRoundGroup = {
    roundName: 'Lower Final',
    roundOrder: 2,
    matches: [createMatch(2010, 'Lower Final', 2, 'TBD', 'TBD', tId, title, 'lower')],
  }

  const grandFinal = createMatch(2011, 'Grand final', 4, 'TBD', 'TBD', tId, title, 'grand_final')

  return {
    tournamentId: tId,
    tournamentTitle: title,
    bracketType: 'double_elimination',
    upperBracket: [upperQF, upperSF, upperFinal],
    lowerBracket: [lowerR1, lowerFinal],
    grandFinal,
    allRounds: [upperQF, upperSF, upperFinal, lowerR1, lowerFinal],
  }
}
