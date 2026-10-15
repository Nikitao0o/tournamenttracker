import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, useParams } from 'react-router-dom'
import { getPlayerById, getTeamById } from '../mock/data'

export function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const player = id ? getPlayerById(id) : undefined
  const team = player ? getTeamById(player.teamId) : undefined

  if (!player) {
    return (
      <Stack spacing={2}>
        <Typography variant="h1">Player not found</Typography>
        <Button component={Link} to="/players" variant="outlined">
          Back to players
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Button component={Link} to="/players" sx={{ alignSelf: 'flex-start' }}>
        ← Players
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
            <div>
              <Typography variant="h1">{player.name}</Typography>
              <Typography color="text.secondary">
                {player.age} years old • {player.nationality}
              </Typography>
            </div>
            <Chip label={player.role} color="secondary" sx={{ alignSelf: 'flex-start' }} />
          </Stack>

          <Typography color="text.secondary">
            Team: <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{player.teamName}</Box>
          </Typography>

          {team ? (
            <Button component={Link} to={`/teams/${team.id}`} variant="contained" sx={{ alignSelf: 'flex-start' }}>
              View team roster
            </Button>
          ) : null}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Key stats
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Typography color="text.secondary">K/D ratio</Typography>
            <Typography variant="h3" sx={{ fontSize: 28, mt: 1 }}>
              {player.stats.kd}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Typography color="text.secondary">Impact rating</Typography>
            <Typography variant="h3" sx={{ fontSize: 28, mt: 1 }}>
              {player.stats.impact}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', p: 2 }}>
            <Typography color="text.secondary">Maps played</Typography>
            <Typography variant="h3" sx={{ fontSize: 28, mt: 1 }}>
              {player.stats.maps}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}
