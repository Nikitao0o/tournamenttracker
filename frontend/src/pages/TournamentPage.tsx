import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, useParams } from 'react-router-dom'
import { MatchList } from '../components/MatchList'
import { TournamentStatusLabel } from '../components/StatusChips'
import { formatDate } from '../utils/formatting'
import { getMatches, getTournament } from '../api/client'
import { useApi } from '../api/useApi'
import { ApiState } from '../components/ApiState'
import { useCallback } from 'react'

export function TournamentPage() {
  const { id } = useParams<{ id: string }>()
  const loadTournament = useCallback(async () => {
    const [tournament, matches] = await Promise.all([
      getTournament(id ?? ''),
      getMatches(id ?? ''),
    ])
    return { tournament, matches }
  }, [id])
  const { data, loading, error } = useApi(loadTournament)

  if (loading || error) return <ApiState loading={loading} error={error} />
  if (!data) return null
  const { tournament, matches } = data

  if (!tournament) {
    return (
      <Stack spacing={2}>
        <Typography variant="h1">Tournament not found</Typography>
        <Button component={Link} to="/tournaments" variant="outlined">
          Back to tournaments
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Button component={Link} to="/tournaments" sx={{ alignSelf: 'flex-start' }}>
        ← Tournaments
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h1" sx={{ mr: 1 }}>
              {tournament.title}
            </Typography>
            <TournamentStatusLabel status={tournament.status} />
          </Stack>
          <Typography color="text.secondary">{tournament.location}</Typography>
          <Typography sx={{ fontWeight: 600 }}>Prize pool {tournament.prizePool}</Typography>
          <Typography color="text.secondary">
            {formatDate(tournament.startDate)} — {formatDate(tournament.endDate)}
          </Typography>
        </Stack>
      </Paper>

      <div>
        <Typography variant="h2" sx={{ mb: 1.5 }}>
          Matches
        </Typography>
        <MatchList matches={matches} emptyText="No demo matches for this event yet." />
      </div>
    </Stack>
  )
}
