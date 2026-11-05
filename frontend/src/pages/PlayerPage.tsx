import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useAuth } from '../app/providers/useAuth'
import { apiClient } from '../shared/api/client'
import type { Player, Team } from '../types'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { MediaUploadDialog } from '../features/manage-media/ui/MediaUploadDialog'
import { EditPlayerDialog } from '../features/manage-players/ui/EditPlayerDialog'
import { getErrorMessage } from '../shared/api/errors'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'

export function PlayerPage() {
  const { user, isAdmin } = useAuth()
  const { id } = useParams<{ id: string }>()

  const [player, setPlayer] = useState<Player | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPlayerOpen, setEditPlayerOpen] = useState(false)
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  useEffect(() => {
    let mounted = true
    if (!id) return

    apiClient.getTeams().then((tList) => {
      if (mounted) setAvailableTeams(tList)
    }).catch(() => {})

    apiClient
      .getPlayers()
      .then((playersList) => {
        if (!mounted) return
        const found = playersList.find(
          (p) => String(p.id) === id || p.nickname?.toLowerCase() === id.toLowerCase() || p.name.toLowerCase() === id.toLowerCase()
        )
        if (found) {
          setPlayer(found)
          return apiClient.getTeam(found.teamId).then((t) => {
            if (mounted) {
              setTeam(t)
              setIsLoading(false)
            }
          })
        } else {
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Error loading player profile')
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [id])

  const canEditAvatar = Boolean(
    isAdmin || (user && user.player_id && String(user.player_id) === String(player?.id))
  )

  const handleSaveAvatar = async (dataUrl: string) => {
    if (!player) return
    try {
      const updated = await apiClient.uploadPlayerAvatar(player.id, dataUrl)
      setPlayer(updated)
      setNotification({ message: 'Player avatar updated successfully!', severity: 'success' })
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setNotification({ message: msg, severity: 'error' })
      throw err
    }
  }

  const handleResetAvatar = async () => {
    if (!player) return
    try {
      const updated = await apiClient.updatePlayer(player.id, { avatarUrl: '' })
      setPlayer(updated)
      setNotification({ message: 'Player avatar reset successfully', severity: 'success' })
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setNotification({ message: msg, severity: 'error' })
      throw err
    }
  }

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <CardSkeleton count={3} />
      </Stack>
    )
  }

  if (!player) {
    return (
      <Stack spacing={2}>
        <Breadcrumbs
          separator="/"
          aria-label="breadcrumb"
          sx={{
            fontSize: 14,
            '& .MuiBreadcrumbs-separator': { mx: 1, color: 'text.secondary' },
          }}
        >
          <MuiLink
            component={RouterLink}
            to="/players"
            underline="hover"
            color="text.secondary"
            sx={{ fontWeight: 600, '&:hover': { color: 'primary.main' } }}
          >
            Players
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: 14 }}>
            Not Found
          </Typography>
        </Breadcrumbs>
        <Typography variant="h1">Player not found</Typography>
        <Button component={RouterLink} to="/players" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
          Back to players
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Breadcrumbs
        separator="/"
        aria-label="breadcrumb"
        sx={{
          fontSize: 14,
          '& .MuiBreadcrumbs-separator': { mx: 1, color: 'text.secondary' },
        }}
      >
        <MuiLink
          component={RouterLink}
          to="/players"
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 600, '&:hover': { color: 'primary.main' } }}
        >
          Players
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: 14 }}>
          {player.name}
        </Typography>
      </Breadcrumbs>

      {error && <Alert severity="warning">{error}</Alert>}

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} teamId={player.teamId} size={72} />
              <div>
                <Typography variant="h1" sx={{ fontSize: { xs: 24, sm: 30 } }}>
                  {player.nickname ? player.nickname : player.name}
                </Typography>
                <Typography color="text.secondary">
                  {player.name} • {player.age} years old • {player.nationality}
                </Typography>
              </div>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip label={player.role} color="secondary" sx={{ fontWeight: 700 }} />
              {isAdmin && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setEditPlayerOpen(true)}
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: '#f04b3a',
                    color: '#fff',
                    '&:hover': { bgcolor: '#d93b2a' },
                  }}
                >
                  ✏ Edit Player
                </Button>
              )}
              {canEditAvatar && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setDialogOpen(true)}
                  sx={{ fontSize: 11, fontWeight: 700 }}
                >
                  Change Avatar
                </Button>
              )}
            </Stack>
          </Stack>

          {team && (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', pt: 1 }}>
              <TeamLogo teamName={team.name} logoUrl={team.logoUrl} size={28} />
              <MuiLink
                component={RouterLink}
                to={`/teams/${team.id}`}
                underline="hover"
                sx={{ fontWeight: 700, fontSize: 16, color: 'text.primary' }}
              >
                {team.name}
              </MuiLink>
              <Chip label={`#${team.ranking}`} size="small" variant="outlined" />
            </Stack>
          )}
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          HLTV Performance Statistics
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>K/D Ratio</Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>{player.stats.kd}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>Impact Rating</Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>{player.stats.impact}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>Maps Played</Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>{player.stats.maps}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>Rating 2.0</Typography>
              <Typography variant="h3" sx={{ mt: 0.5, color: 'primary.main' }}>
                {player.stats.rating ?? (Number(player.stats.impact) / 10 + 0.3).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {canEditAvatar && (
        <MediaUploadDialog
          open={dialogOpen}
          title="Upload Player Avatar (PNG / JPG)"
          entityName={player.name}
          currentValue={player.avatarUrl || undefined}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveAvatar}
          onReset={handleResetAvatar}
        />
      )}

      {isAdmin && (
        <EditPlayerDialog
          open={editPlayerOpen}
          player={player}
          availableTeams={availableTeams}
          onClose={() => setEditPlayerOpen(false)}
          onSubmit={async (updated) => {
            try {
              let savedPlayer = await apiClient.updatePlayer(updated.id, {
                nickname: updated.nickname,
                name: updated.name,
                age: updated.age,
                role: updated.role,
                nationality: updated.nationality,
                teamId: updated.teamId,
                avatarUrl: updated.avatarUrl && !updated.avatarUrl.startsWith('data:image') ? updated.avatarUrl : undefined,
                stats: updated.stats,
              })
              if (updated.avatarUrl && updated.avatarUrl.startsWith('data:image')) {
                savedPlayer = await apiClient.uploadPlayerAvatar(updated.id, updated.avatarUrl)
              }
              setPlayer(savedPlayer)
              if (savedPlayer.teamId) {
                apiClient.getTeam(savedPlayer.teamId).then(setTeam).catch(() => setTeam(null))
              } else {
                setTeam(null)
              }
              setEditPlayerOpen(false)
              setNotification({ message: 'Player profile updated successfully!', severity: 'success' })
            } catch (err) {
              setError(getErrorMessage(err))
            }
          }}
        />
      )}

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification?.severity || 'info'}
          onClose={() => setNotification(null)}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
