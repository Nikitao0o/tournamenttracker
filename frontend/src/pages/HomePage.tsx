import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { MatchList } from '../components/MatchList'
import { RankingBox } from '../components/RankingBox'
import { TournamentCard } from '../components/TournamentCard'
import { SectionHeader } from '../components/SectionHeader'
import Box from '@mui/material/Box'
import { MOCK_MATCHES, MOCK_TOURNAMENTS } from '../mock/data'

export function HomePage() {
  const live = MOCK_MATCHES.filter((match) => match.status === 'LIVE')
  const upcoming = MOCK_MATCHES.filter((match) => match.status === 'UPCOMING')
  const results = MOCK_MATCHES.filter((match) => match.status === 'FINISHED')

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
          <RankingBox />
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <SectionHeader title="Events" />
            {MOCK_TOURNAMENTS.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </Box>
        </Stack>
      </Grid>
    </Grid>
  )
}
