import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { apiClient } from '../shared/api/client'
import { useAuth } from '../app/providers/useAuth'
import type { Player, Team } from '../types'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'
import { EditPlayerDialog } from '../features/manage-players/ui/EditPlayerDialog'

export function PlayersPage() {
  const { isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([apiClient.getPlayers(), apiClient.getTeams()])
      .then(([playersList, teamsList]) => {
        if (mounted) {
          setPlayers(playersList)
          setTeams(teamsList)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load players')
          setIsLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1">Players</Typography>

      {error && <Alert severity="warning">{error}</Alert>}

      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <CardSkeleton count={2} />
            </Grid>
          ))}
        </Grid>
      ) : players.length === 0 ? (
        <Alert severity="info">No players registered yet.</Alert>
      ) : (
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
                        {player.age} y/o • {player.nationality}
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

                  <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                    <Button component={Link} to={`/players/${player.id}`} variant="contained" fullWidth>
                      View profile
                    </Button>
                    {isAdmin ? (
                      <Button
                        variant="outlined"
                        onClick={() => setEditingPlayer(player)}
                        sx={{ borderColor: '#f04b3a', color: '#f04b3a' }}
                      >
                        ✏ Edit
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {isAdmin && (
        <EditPlayerDialog
          open={Boolean(editingPlayer)}
          player={editingPlayer}
          availableTeams={teams}
          onClose={() => setEditingPlayer(null)}
          onSubmit={async (updated) => {
            try {
              const res = await apiClient.updatePlayer(updated.id, {
                nickname: updated.nickname,
                name: updated.name,
                age: updated.age,
                role: updated.role,
                nationality: updated.nationality,
                teamId: updated.teamId,
                avatarUrl: updated.avatarUrl || undefined,
                stats: updated.stats,
              })
              setPlayers((prev) => prev.map((p) => (p.id === res.id ? res : p)))
              setEditingPlayer(null)
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Failed to update player')
            }
          }}
        />
      )}
    </Stack>
  )
}
