import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, useParams } from 'react-router-dom'
import { getPlayersByTeamId, getTeamByReference } from '../mock/data'

export function TeamPage() {
  const { teamRef } = useParams<{ teamRef: string }>()
  const team = teamRef ? getTeamByReference(teamRef) : undefined
  const players = team ? getPlayersByTeamId(team.id) : []

  if (!team) {
    return (
      <Stack spacing={2}>
        <Typography variant="h1">Team not found</Typography>
        <Button component={Link} to="/teams" variant="outlined">
          Back to teams
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Button component={Link} to="/teams" sx={{ alignSelf: 'flex-start' }}>
        ← Teams
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
            <div>
              <Typography variant="h1">{team.name}</Typography>
              <Typography color="text.secondary">
                {team.region} • Coach: {team.coach}
              </Typography>
            </div>
            <Chip label={`#${team.ranking}`} color="secondary" sx={{ alignSelf: 'flex-start' }} />
          </Stack>

          <Typography color="text.secondary">{team.description}</Typography>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Roster
        </Typography>

        <Grid container spacing={2}>
          {players.map((player) => (
            <Grid key={player.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontSize: 24 }}>
                      {player.name}
                    </Typography>
                    <Chip label={player.role} size="small" />
                  </Stack>
                  <Typography color="text.secondary">
                    {player.age} • {player.nationality}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>K/D {player.stats.kd}</Typography>
                  <Typography color="text.secondary">Impact rating {player.stats.impact}</Typography>
                  <Button component={Link} to={`/players/${player.id}`} variant="outlined" sx={{ mt: 'auto' }}>
                    Player profile
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  )
}
