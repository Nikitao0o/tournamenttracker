import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useAuth } from '../app/providers/useAuth'
import { apiClient } from '../shared/api/client'
import type { Player, Team } from '../types'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { MediaUploadDialog } from '../features/manage-media/ui/MediaUploadDialog'
import { getErrorMessage } from '../shared/api/errors'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'

function getSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function TeamPage() {
  const { isAdmin } = useAuth()
  const { teamRef } = useParams<{ teamRef: string }>()

  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(teamRef))
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!teamRef) return

    apiClient
      .getTeams()
      .then((teams) => {
        if (!mounted) return
        const found = teams.find(
          (t) => String(t.id) === teamRef || getSlug(t.name) === teamRef.toLowerCase()
        )
        if (found) {
          setTeam(found)
          return apiClient.getTeamPlayers(found.id).then((roster) => {
            if (mounted) {
              setPlayers(roster)
              setIsLoading(false)
            }
          })
        } else {
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Error loading team data')
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [teamRef])

  const handleSaveLogo = async (dataUrl: string) => {
    if (!team) return
    try {
      const updated = await apiClient.uploadTeamLogo(team.id, dataUrl)
      setTeam(updated)
    } catch (err: unknown) {
      alert(getErrorMessage(err))
    }
  }

  const handleResetLogo = () => {
    if (!team) return
  }

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <CardSkeleton count={3} />
      </Stack>
    )
  }

  if (!team) {
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
            to="/teams"
            underline="hover"
            color="text.secondary"
            sx={{ fontWeight: 600, '&:hover': { color: 'primary.main' } }}
          >
            Teams
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: 14 }}>
            Not Found
          </Typography>
        </Breadcrumbs>
        <Typography variant="h1">Team not found</Typography>
        <Button component={RouterLink} to="/teams" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
          Back to teams
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
          to="/teams"
          underline="hover"
          color="text.secondary"
          sx={{ fontWeight: 600, '&:hover': { color: 'primary.main' } }}
        >
          Teams
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: 14 }}>
          {team.name}
        </Typography>
      </Breadcrumbs>

      {error && <Alert severity="warning">{error}</Alert>}

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
              <TeamLogo teamName={team.name} logoUrl={team.logoUrl} size={64} />
              <div>
                <Typography variant="h1" sx={{ fontSize: { xs: 22, sm: 28 } }}>{team.name}</Typography>
                <Typography color="text.secondary">
                  {team.region} • Coach: {team.coach}
                </Typography>
              </div>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip label={`#${team.ranking} World Rank`} color="secondary" sx={{ fontWeight: 800 }} />
              {isAdmin ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setDialogOpen(true)}
                  sx={{ fontSize: 11, fontWeight: 700 }}
                >
                  Change Logo (PNG / JPG)
                </Button>
              ) : null}
            </Stack>
          </Stack>

          <Typography color="text.secondary">{team.description}</Typography>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Roster
        </Typography>

        {players.length === 0 ? (
          <Alert severity="info">No players assigned to this team roster yet.</Alert>
        ) : (
          <Grid container spacing={2}>
            {players.map((player) => (
              <Grid key={player.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} teamId={player.teamId} size={42} />
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
                    <Typography sx={{ fontWeight: 700 }}>K/D {player.stats.kd}</Typography>
                    <Typography color="text.secondary">Impact rating {player.stats.impact}</Typography>
                    <Button component={RouterLink} to={`/players/${player.id}`} variant="outlined" sx={{ mt: 'auto' }}>
                      Player profile
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {isAdmin && (
        <MediaUploadDialog
          open={dialogOpen}
          title="Upload Team Logo (PNG / JPG)"
          entityName={team.name}
          currentValue={team.logoUrl || undefined}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveLogo}
          onReset={handleResetLogo}
        />
      )}
    </Stack>
  )
}
