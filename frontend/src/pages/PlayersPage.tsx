import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { MOCK_PLAYERS } from '../mock/data'
import { storage } from '../shared/api/storage'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { TeamLogo } from '../shared/ui/TeamLogo'

export function PlayersPage() {
  const players = storage.getPlayers() || MOCK_PLAYERS

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1">Players</Typography>

      <Grid container spacing={2}>
        {players.map((player) => (
          <Grid key={player.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} teamId={player.teamId} size={48} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h3" sx={{ fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 11 }}>
                      {player.age} • {player.nationality}
                    </Typography>
                  </Box>
                  <Chip label={player.role} size="small" />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TeamLogo teamName={player.teamName} size={20} />
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{player.teamName}</Typography>
                </Stack>

                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  K/D: <strong>{player.stats.kd}</strong> • Impact: <strong>{player.stats.impact}</strong>
                </Typography>

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
