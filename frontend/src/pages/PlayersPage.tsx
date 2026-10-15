import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { MOCK_PLAYERS } from '../mock/data'

export function PlayersPage() {
  return (
    <Stack spacing={2.5}>
      <Typography variant="h1">Players</Typography>

      <Grid container spacing={2}>
        {MOCK_PLAYERS.map((player) => (
          <Grid key={player.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h3" sx={{ fontSize: 24 }}>
                    {player.name}
                  </Typography>
                  <Chip label={player.role} size="small" />
                </Stack>

                <Typography color="text.secondary">
                  {player.age} • {player.nationality}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{player.teamName}</Typography>
                <Typography color="text.secondary">K/D {player.stats.kd}</Typography>

                <Button component={Link} to={`/players/${player.id}`} variant="contained" sx={{ mt: 'auto' }}>
                  View profile
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
