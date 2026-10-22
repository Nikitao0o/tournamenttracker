import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link, useParams } from 'react-router-dom'
import { getPlayerById, getTeamById } from '../mock/data'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { MediaUploadDialog } from '../features/manage-media/ui/MediaUploadDialog'
import { storage } from '../shared/api/storage'

export function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const player = id ? getPlayerById(id) : undefined
  const team = player ? getTeamById(player.teamId) : undefined

  const [dialogOpen, setDialogOpen] = useState(false)
  const [, setVersion] = useState(0)

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

  const handleSaveAvatar = (dataUrl: string) => {
    storage.setPlayerAvatar(player.name, dataUrl)
    setVersion((v) => v + 1)
  }

  const handleResetAvatar = () => {
    storage.removePlayerAvatar(player.name)
    setVersion((v) => v + 1)
  }

  return (
    <Stack spacing={3}>
      <Button component={Link} to="/players" sx={{ alignSelf: 'flex-start' }}>
        ← Players
      </Button>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} teamId={player.teamId} size={72} />
              <div>
                <Typography variant="h1" sx={{ fontSize: { xs: 22, sm: 28 } }}>{player.name}</Typography>
                <Typography color="text.secondary">
                  {player.age} years old • {player.nationality}
                </Typography>
              </div>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip label={player.role} color="secondary" sx={{ fontWeight: 800 }} />
              <Button
                variant="outlined"
                size="small"
                onClick={() => setDialogOpen(true)}
                sx={{ fontSize: 11, fontWeight: 700 }}
              >
                📷 Сменить аватар (PNG / JPG)
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography color="text.secondary">Team:</Typography>
            <TeamLogo teamName={player.teamName} size={22} />
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {player.teamName}
            </Box>
          </Stack>

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

      <MediaUploadDialog
        open={dialogOpen}
        title="Загрузка аватара игрока (PNG / JPG)"
        entityName={player.name}
        currentValue={storage.getPlayerAvatar(player.name) || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveAvatar}
        onReset={handleResetAvatar}
      />
    </Stack>
  )
}
