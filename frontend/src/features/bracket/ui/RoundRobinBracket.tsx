import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { BracketMatch, TournamentBracketView } from '../../../types'
import { BracketMatchCard } from './BracketMatchCard'
import { TeamLogo } from '../../../shared/ui/TeamLogo'

interface RoundRobinBracketProps {
  bracket: TournamentBracketView
}

interface TeamStanding {
  name: string
  logoUrl?: string | null
  played: number
  won: number
  lost: number
  points: number
  mapDiff: number
}

export function RoundRobinBracket({ bracket }: RoundRobinBracketProps) {
  const { allRounds } = bracket

  // Calculate dynamic group standings from all completed matches
  const standings = useMemo(() => {
    const stats: Record<string, TeamStanding> = {}

    const ensureTeam = (name: string, logo?: string | null) => {
      if (!name || name === 'TBD') return
      if (!stats[name]) {
        stats[name] = {
          name,
          logoUrl: logo,
          played: 0,
          won: 0,
          lost: 0,
          points: 0,
          mapDiff: 0,
        }
      }
    }

    allRounds.forEach((round) => {
      round.matches.forEach((m: BracketMatch) => {
        ensureTeam(m.teamAName, m.teamALogoUrl)
        ensureTeam(m.teamBName, m.teamBLogoUrl)

        if (m.status === 'FINISHED' && m.scoreA !== null && m.scoreB !== null && m.scoreA !== undefined && m.scoreB !== undefined) {
          const tA = stats[m.teamAName]
          const tB = stats[m.teamBName]
          if (tA && tB) {
            tA.played += 1
            tB.played += 1

            tA.mapDiff += (m.scoreA - m.scoreB)
            tB.mapDiff += (m.scoreB - m.scoreA)

            if (m.scoreA > m.scoreB) {
              tA.won += 1
              tA.points += 3
              tB.lost += 1
            } else if (m.scoreB > m.scoreA) {
              tB.won += 1
              tB.points += 3
              tA.lost += 1
            } else {
              tA.points += 1
              tB.points += 1
            }
          }
        }
      })
    })

    return Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.mapDiff - a.mapDiff
    })
  }, [allRounds])

  return (
    <Stack spacing={4}>
      {/* Group Standings Table */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 4, height: 18, bgcolor: '#00e5ff', borderRadius: 0.5 }} />
          <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
            ROUND ROBIN GROUP STANDINGS
          </Typography>
        </Stack>

        <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#17191e', borderColor: '#2d323b', borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#121417' }}>
              <TableRow>
                <TableCell sx={{ color: '#8b929e', fontWeight: 800, fontSize: 11, width: 40 }}>#</TableCell>
                <TableCell sx={{ color: '#8b929e', fontWeight: 800, fontSize: 11 }}>TEAM</TableCell>
                <TableCell align="center" sx={{ color: '#8b929e', fontWeight: 800, fontSize: 11, width: 60 }}>P</TableCell>
                <TableCell align="center" sx={{ color: '#8b929e', fontWeight: 800, fontSize: 11, width: 60 }}>W</TableCell>
                <TableCell align="center" sx={{ color: '#8b929e', fontWeight: 800, fontSize: 11, width: 60 }}>L</TableCell>
                <TableCell align="center" sx={{ color: '#8b929e', fontWeight: 800, fontSize: 11, width: 70 }}>DIFF</TableCell>
                <TableCell align="right" sx={{ color: '#00e5ff', fontWeight: 900, fontSize: 12, width: 80 }}>PTS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {standings.map((team, idx) => (
                <TableRow
                  key={team.name}
                  sx={{
                    borderBottom: '1px solid #242831',
                    bgcolor: idx < 2 ? 'rgba(0, 229, 255, 0.03)' : 'transparent',
                    '&:last-child': { border: 0 },
                  }}
                >
                  <TableCell sx={{ color: idx < 2 ? '#00e5ff' : '#8b929e', fontWeight: 800, fontSize: 12 }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                      <TeamLogo teamName={team.name} logoUrl={team.logoUrl ?? undefined} size={22} variant="rounded" />
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                        {team.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#abb3c0', fontSize: 12 }}>{team.played}</TableCell>
                  <TableCell align="center" sx={{ color: '#69f0ae', fontWeight: 700, fontSize: 12 }}>{team.won}</TableCell>
                  <TableCell align="center" sx={{ color: '#f04b3a', fontSize: 12 }}>{team.lost}</TableCell>
                  <TableCell align="center" sx={{ color: team.mapDiff > 0 ? '#69f0ae' : team.mapDiff < 0 ? '#f04b3a' : '#abb3c0', fontSize: 12, fontWeight: 700 }}>
                    {team.mapDiff > 0 ? `+${team.mapDiff}` : team.mapDiff}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#00e5ff', fontWeight: 900, fontSize: 14 }}>
                    {team.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Group Stage Matches Schedule */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 4, height: 18, bgcolor: '#f04b3a', borderRadius: 0.5 }} />
          <Typography variant="h2" sx={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
            ROUND BY ROUND FIXTURES
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
