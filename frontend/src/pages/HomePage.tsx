import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useTournaments } from '../app/providers/useTournaments'
import { MatchList } from '../components/MatchList'
import { RankingBox } from '../components/RankingBox'
import { SectionHeader } from '../components/SectionHeader'
import { TournamentCard } from '../components/TournamentCard'
import { apiClient } from '../shared/api/client'
import type { Match } from '../types'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'

export function HomePage() {
  const { tournaments, isLoading: tournamentsLoading } = useTournaments()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoadingMatches, setIsLoadingMatches] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiClient
      .getMatches()
      .then((data) => {
        if (mounted) {
          setMatches(data)
          setIsLoadingMatches(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load matches')
          setIsLoadingMatches(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  const live = matches.filter((match) => match.status === 'LIVE')
  const upcoming = matches.filter((match) => match.status === 'UPCOMING')
  const results = matches.filter((match) => match.status === 'FINISHED')

  return (
    <Grid container spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={1.5}>
          {error && <Alert severity="warning">{error}</Alert>}

          {isLoadingMatches ? (
            <Box sx={{ p: 2 }}>
              <CardSkeleton count={3} />
            </Box>
          ) : (
            <>
              <MatchList title="Live matches" matches={live} emptyText="No live matches currently." />
              <MatchList title="Upcoming Matches" matches={upcoming} emptyText="No upcoming matches scheduled." />
              <MatchList title="Recent Results" matches={results} emptyText="No match results yet." />
            </>
          )}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={1.5}>
          <RankingBox />
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <SectionHeader title="Events" />
            {tournamentsLoading ? (
              <Box sx={{ p: 1.5 }}>
                <CardSkeleton count={3} />
              </Box>
            ) : tournaments.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Alert severity="info">No active tournament events found.</Alert>
              </Box>
            ) : (
              tournaments
                .slice(0, 6)
                .map((tournament) => <TournamentCard key={tournament.id} tournament={tournament} />)
            )}
          </Box>
        </Stack>
      </Grid>
    </Grid>
  )
}
