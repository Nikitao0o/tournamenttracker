import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, useParams } from 'react-router-dom'
import { MatchList } from '../components/MatchList'
import { getMatchesByTeam, getTeamBySlug, MOCK_RANKING } from '../mock/data'

export function TeamPage() {
  const { slug } = useParams<{ slug: string }>()
  const team = slug ? getTeamBySlug(slug) : undefined

  if (!team) {
    return (
      <Stack spacing={2}>
        <Typography variant="h1">Team not found</Typography>
        <Button component={Link} to="/leaderboards/teams" variant="outlined">
          Back to team ranking
        </Button>
      </Stack>
    )
  }

  const ranking = MOCK_RANKING.indexOf(team)
  const matches = getMatchesByTeam(team)

  return (
    <Stack spacing={1.5}>
      <Button component={Link} to="/leaderboards/teams" sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}>
        ← Team ranking
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={1}>
          <Typography variant="h1">{team}</Typography>
          {ranking >= 0 ? (
            <Typography color="text.secondary">World ranking #{ranking + 1}</Typography>
          ) : null}
        </Stack>
      </Paper>

      <MatchList title="Matches" matches={matches} emptyText="No matches for this team yet." />
    </Stack>
  )
}
