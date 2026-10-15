import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { MatchList } from '../components/MatchList'
import { RankingBox } from '../components/RankingBox'
import { TournamentCard } from '../components/TournamentCard'
import { SectionHeader } from '../components/SectionHeader'
import Box from '@mui/material/Box'
import { ApiState } from '../components/ApiState'
import { getMatches, getTeamLeaderboard, getTournaments } from '../api/client'
import { useApi } from '../api/useApi'
import { useCallback } from 'react'

export function HomePage() {
  const loadHomePage = useCallback(async () => {
    const [matches, tournaments, teams] = await Promise.all([
      getMatches(),
      getTournaments(),
      getTeamLeaderboard(),
    ])
    return { matches, tournaments, teams }
  }, [])
  const { data, loading, error } = useApi(loadHomePage)

  if (loading || error) return <ApiState loading={loading} error={error} />
  if (!data) return null

  const live = data.matches.filter((match) => match.status === 'LIVE')
  const upcoming = data.matches.filter((match) => match.status === 'UPCOMING')
  const results = data.matches.filter((match) => match.status === 'FINISHED')

  return (
    <Grid container spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={1.5}>
          <MatchList title="Live matches" matches={live} emptyText="No live matches." />
          <MatchList title="Matches" matches={upcoming} emptyText="No upcoming matches." />
          <MatchList title="Results" matches={results} emptyText="No results yet." />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={1.5}>
          <RankingBox teams={data.teams} />
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <SectionHeader title="Events" />
            {data.tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </Box>
        </Stack>
      </Grid>
    </Grid>
  )
}
