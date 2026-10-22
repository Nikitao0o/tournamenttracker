import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { BracketMatch, TournamentBracketView } from '../../../types'
import { BracketMatchCard } from './BracketMatchCard'
import { TeamLogo } from '../../../shared/ui/TeamLogo'

interface SwissBracketProps {
  bracket: TournamentBracketView
}

interface SwissTeamStatus {
  name: string
  logoUrl?: string | null
  wins: number
  losses: number
}

export function SwissBracket({ bracket }: SwissBracketProps) {
  const { allRounds } = bracket

  // Calculate team Swiss records (W-L)
  const teamRecords = useMemo(() => {
    const records: Record<string, SwissTeamStatus> = {}

    const ensureTeam = (name: string, logo?: string | null) => {
      if (!name || name === 'TBD') return
      if (!records[name]) {
        records[name] = { name, logoUrl: logo, wins: 0, losses: 0 }
      }
    }

    allRounds.forEach((round) => {
      round.matches.forEach((m: BracketMatch) => {
        ensureTeam(m.teamAName, m.teamALogoUrl)
        ensureTeam(m.teamBName, m.teamBLogoUrl)

        if (m.status === 'FINISHED' && m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined) {
          const tA = records[m.teamAName]
          const tB = records[m.teamBName]
          if (tA && tB) {
            if (m.scoreA > m.scoreB) {
              tA.wins += 1
              tB.losses += 1
            } else if (m.scoreB > m.scoreA) {
              tB.wins += 1
              tA.losses += 1
            }
          }
        }
      })
    })

    return Object.values(records).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.losses - b.losses
    })
  }, [allRounds])

  return (
    <Stack spacing={4}>
      {/* Swiss Pools Standings Banner */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 4, height: 18, bgcolor: '#b388ff', borderRadius: 0.5 }} />
          <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
            SWISS STAGE STANDINGS (3 WINS ADVANCE, 3 LOSSES ELIMINATE)
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          {teamRecords.map((team) => {
            const isQualified = team.wins >= 3
            const isEliminated = team.losses >= 3
            const badgeColor = isQualified ? '#69f0ae' : isEliminated ? '#f04b3a' : '#b388ff'

            return (
              <Grid key={team.name} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: '#17191e',
                    borderColor: isQualified ? '#69f0ae' : isEliminated ? '#f04b3a' : '#2d323b',
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                    <TeamLogo teamName={team.name} logoUrl={team.logoUrl ?? undefined} size={24} variant="rounded" />
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                      {team.name}
                    </Typography>
                  </Stack>

                  <Chip
                    label={`${team.wins} - ${team.losses}`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: 11,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      color: badgeColor,
                      border: `1px solid ${badgeColor}`,
                    }}
                  />
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      {/* Swiss Rounds Match Schedule */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 4, height: 18, bgcolor: '#f04b3a', borderRadius: 0.5 }} />
          <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
            SWISS ROUNDS & MATCH PAIRINGS
          </Typography>
        </Stack>

        <Box sx={{ overflowX: 'auto', pb: 2 }}>
          <Stack direction="row" spacing={3} sx={{ minWidth: 'max-content', alignItems: 'flex-start' }}>
            {allRounds.map((round) => (
              <Stack key={round.roundName} spacing={2} sx={{ width: 290 }}>
                <Box sx={{ pb: 0.5, borderBottom: '2px solid #282c35' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#9aa0ac', textTransform: 'uppercase' }}>
                    {round.roundName}
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {round.matches.map((m) => (
                    <BracketMatchCard key={m.id} match={m} width="100%" />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Stack>
  )
}
