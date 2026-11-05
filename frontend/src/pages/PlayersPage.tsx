import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { apiClient } from '../shared/api/client'
import { useAuth } from '../app/providers/useAuth'
import type { Player, Team } from '../types'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'
import { EmptyState } from '../shared/ui/EmptyState'
import { EditPlayerDialog } from '../features/manage-players/ui/EditPlayerDialog'

export function PlayersPage() {
  const { isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [search, setSearch] = useState('')
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

  const filteredPlayers = players.filter((player) => {
    if (!search.trim()) return true
    const term = search.toLowerCase().trim()
    return (
      (player.nickname && player.nickname.toLowerCase().includes(term)) ||
      player.name.toLowerCase().includes(term) ||
      player.teamName.toLowerCase().includes(term) ||
      player.role.toLowerCase().includes(term) ||
      player.nationality.toLowerCase().includes(term)
    )
  })

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <div>
          <Typography variant="h1">Players</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.3 }}>
            Professional esports players, roles, statistics, and roster affiliations
          </Typography>
        </div>
        <Chip
          label={`${filteredPlayers.length} of ${players.length} players`}
          size="small"
          variant="outlined"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontWeight: 700 }}
        />
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
        <TextField
          placeholder="Search players by nickname, full name, or team..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="span" sx={{ display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </Box>
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => setSearch('')}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: 11, color: 'text.secondary', fontWeight: 700 }}
                  >
                    Clear
                  </Button>
                </InputAdornment>
              ) : null,
              sx: { bgcolor: 'background.default', fontSize: 13 },
            },
          }}
        />
      </Paper>

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
      ) : filteredPlayers.length === 0 ? (
        <EmptyState
          title="No players match your search"
          description={`No players found for "${search}". Try searching by nickname, real name, or team.`}
          actionLabel="Clear search"
          onAction={() => setSearch('')}
        />
      ) : (
        <Grid container spacing={2}>
          {filteredPlayers.map((player) => (
            <Grid key={player.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} teamId={player.teamId} size={48} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h3" sx={{ fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.nickname || player.name}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.nickname && player.nickname !== player.name ? `${player.name} • ` : ''}
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
