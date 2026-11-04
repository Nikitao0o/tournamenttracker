import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { MatchStatusLabel, ScorePair } from '../components/StatusChips'
import { formatDate } from '../utils/formatting'
import { apiClient } from '../shared/api/client'
import type { Match } from '../types'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'

export function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (!id) return

    apiClient
      .getMatch(id)
      .then((data) => {
        if (mounted) {
          setMatch(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Match not found')
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [id])

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <CardSkeleton count={3} />
      </Stack>
    )
  }

  if (!match) {
    return (
      <Stack spacing={1.5}>
        <Breadcrumbs
          separator="/"
          aria-label="breadcrumb"
          sx={{
            fontSize: 14,
            '& .MuiBreadcrumbs-separator': { mx: 1, color: 'text.secondary' },
          }}
        >
          <MuiLink
            component={RouterLink}
            to="/"
            underline="hover"
            color="text.secondary"
            sx={{ fontWeight: 600, '&:hover': { color: 'primary.main' } }}
          >
            Matches
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: 14 }}>
            Not Found
          </Typography>
        </Breadcrumbs>
        <Typography variant="h1">Match not found</Typography>
        <Button component={RouterLink} to="/" variant="contained" sx={{ alignSelf: 'flex-start' }}>
          Back to matches
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.5}>
      <Breadcrumbs
        separator="/"
        aria-label="breadcrumb"
        sx={{
          fontSize: 14,
          '& .MuiBreadcrumbs-separator': { mx: 1, color: 'text.secondary' },
        }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 600, '&:hover': { color: 'primary.main' } }}
        >
          Matches
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: 14 }}>
          {match.teamA} vs {match.teamB}
        </Typography>
      </Breadcrumbs>

      {error && <Alert severity="warning">{error}</Alert>}

      {/* Match Header Banner */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            bgcolor: 'secondary.main',
            color: '#fff',
            px: 2,
            py: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography
            component={RouterLink}
            to={`/tournaments/${match.tournamentId}`}
            sx={{ color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}
          >
            {match.tournamentName || 'Tournament'} • {match.roundName || 'Match'} ({match.matchFormat || 'BO3'})
          </Typography>
          <MatchStatusLabel status={match.status} />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 4,
            bgcolor: '#fff',
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-end' } }}
          >
            <Typography
              component={RouterLink}
              to={match.teamAId ? `/teams/${match.teamAId}` : '#'}
              sx={{
                fontSize: { xs: 20, sm: 26 },
                fontWeight: 800,
                textAlign: { sm: 'right' },
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {match.teamA}
            </Typography>
            <TeamLogo teamName={match.teamA} logoUrl={match.teamALogoUrl} size={54} />
          </Stack>

          <Box sx={{ justifySelf: 'center', transform: 'scale(1.8)', transformOrigin: 'center' }}>
            <ScorePair scoreA={match.scoreA} scoreB={match.scoreB} live={match.status === 'LIVE'} />
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' } }}
          >
            <TeamLogo teamName={match.teamB} logoUrl={match.teamBLogoUrl} size={54} />
            <Typography
              component={RouterLink}
              to={match.teamBId ? `/teams/${match.teamBId}` : '#'}
              sx={{
                fontSize: { xs: 20, sm: 26 },
                fontWeight: 800,
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {match.teamB}
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'text.secondary',
          }}
        >
          <Box>Date: {formatDate(match.date)} {match.startTime ? `• ${match.startTime}` : ''}</Box>
          {match.map ? <Box>Map: {match.map}</Box> : null}
        </Box>
      </Box>

      {/* Map Results Breakdown */}
      {match.mapResults && match.mapResults.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h2" sx={{ fontSize: 18, mb: 2 }}>
            Maps Breakdown
          </Typography>
          <Stack spacing={1.5}>
            {match.mapResults.map((map) => (
              <Box
                key={map.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: '#f8f9fa',
                  borderRadius: 1,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Chip label={`Map ${map.mapNumber}`} size="small" />
                  <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{map.mapName}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: map.scoreA > map.scoreB ? 'success.main' : 'text.primary' }}>
                    {map.scoreA}
                  </Typography>
                  <Typography color="text.secondary">:</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: map.scoreB > map.scoreA ? 'success.main' : 'text.primary' }}>
                    {map.scoreB}
                  </Typography>
                  {map.winnerName && (
                    <Chip label={`Winner: ${map.winnerName}`} size="small" color="primary" variant="outlined" />
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* HLTV Detailed Scoreboard */}
      {match.playerStats && match.playerStats.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h2" sx={{ fontSize: 18, mb: 2 }}>
            HLTV Match Scoreboard & Player Statistics
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Player</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Team</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>K - D</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>+/-</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>ADR</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>KAST%</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Rating 2.0</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {match.playerStats.map((stat) => {
                  const diff = stat.kills - stat.deaths
                  return (
                    <TableRow key={stat.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <span>{stat.playerNickname}</span>
                          {stat.isMvp && (
                            <Chip label="★ MVP" size="small" color="warning" sx={{ height: 18, fontSize: 10, fontWeight: 800 }} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {stat.teamName}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {stat.kills} - {stat.deaths}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          color: diff > 0 ? 'success.main' : (diff < 0 ? 'error.main' : 'text.secondary'),
                        }}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </TableCell>
                      <TableCell align="center">{stat.adr.toFixed(1)}</TableCell>
                      <TableCell align="center">{stat.kast.toFixed(1)}%</TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 800,
                          color: stat.rating >= 1.2 ? 'success.main' : (stat.rating < 0.95 ? 'error.main' : 'text.primary'),
                        }}
                      >
                        {stat.rating.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
  )
}
