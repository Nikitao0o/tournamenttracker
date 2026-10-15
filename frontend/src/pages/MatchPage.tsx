import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, useParams } from 'react-router-dom'
import { MatchStatusLabel, ScorePair } from '../components/StatusChips'
import { formatDate } from '../utils/formatting'
import { getMatchById, getTeamSlug } from '../mock/data'

export function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const match = id ? getMatchById(id) : undefined

  if (!match) {
    return (
      <Stack spacing={1.5}>
        <Typography variant="h1">Match not found</Typography>
        <Button component={Link} to="/" variant="contained">
          Back to matches
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Button component={Link} to="/" sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}>
        ← Matches
      </Button>

      <Box sx={{ border: '1px solid', borderColor: 'divider' }}>
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
            component={Link}
            to={`/tournaments/${match.tournamentId}`}
            sx={{ color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}
          >
            {match.tournamentName}
          </Typography>
          <MatchStatusLabel status={match.status} />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 3,
            bgcolor: '#fff',
          }}
        >
          <Typography
            component={Link}
            to={`/teams/${getTeamSlug(match.teamA)}`}
            sx={{
              fontSize: { xs: 22, sm: 28 },
              fontWeight: 800,
              textAlign: { sm: 'right' },
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {match.teamA}
          </Typography>
          <Box sx={{ justifySelf: 'center', transform: 'scale(1.6)', transformOrigin: 'center' }}>
            <ScorePair scoreA={match.scoreA} scoreB={match.scoreB} live={match.status === 'LIVE'} />
          </Box>
          <Typography
            component={Link}
            to={`/teams/${getTeamSlug(match.teamB)}`}
            sx={{
              fontSize: { xs: 22, sm: 28 },
              fontWeight: 800,
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {match.teamB}
          </Typography>
        </Box>

        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#f3f5f7',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'text.secondary',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <span>{match.map ?? 'Map TBA'}</span>
          <span>{formatDate(match.date)}</span>
        </Box>
      </Box>
    </Stack>
  )
}
