import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { MOCK_TEAMS } from '../mock/data'

export function TeamsPage() {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h1">Teams</Typography>

      {MOCK_TEAMS.map((team) => (
        <Paper key={team.id} variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
              <div>
                <Typography variant="h2" sx={{ fontSize: { xs: 24, sm: 30 } }}>
                  {team.name}
                </Typography>
                <Typography color="text.secondary">
                  {team.region} • #{team.ranking}
                </Typography>
              </div>
              <Chip label={team.shortName} color="secondary" sx={{ alignSelf: 'flex-start' }} />
            </Stack>

            <Typography color="text.secondary">{team.description}</Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {team.roster.map((playerName) => (
                <Chip key={`${team.id}-${playerName}`} label={playerName} variant="outlined" />
              ))}
            </Stack>

            <Button component={Link} to={`/teams/${team.id}`} variant="contained" sx={{ alignSelf: 'flex-start' }}>
              View team
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}
