import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ImageUploadField } from '../../../shared/ui/ImageUploadField'
import { validatePlayerForm } from '../../../shared/utils/validation'
import { storage } from '../../../shared/api/storage'
import type { Player, Team } from '../../../types'

interface EditPlayerDialogProps {
  open: boolean
  player: Player | null
  availableTeams: Team[]
  onClose: () => void
  onSubmit: (updated: Player) => void
}

const ROLES = ['Entry Fragger', 'AWPer', 'IGL', 'Support', 'Lurker', 'Rifler']

function EditPlayerFormContent({
  player,
  availableTeams,
  onClose,
  onSubmit,
}: {
  player: Player
  availableTeams: Team[]
  onClose: () => void
  onSubmit: (updated: Player) => void
}) {
  const [name, setName] = useState(() => player.name)
  const [role, setRole] = useState(() => player.role)
  const [nationality, setNationality] = useState(() => player.nationality)
  const [selectedTeamId, setSelectedTeamId] = useState(() => player.teamId || availableTeams[0]?.id || '')
  const [avatarUrl, setAvatarUrl] = useState(() => player.avatarUrl || storage.getPlayerAvatar(player.name) || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedTeam = availableTeams.find((t) => t.id === selectedTeamId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validatePlayerForm({
      name,
      role,
      nationality,
      teamName: selectedTeam?.name || player.teamName || 'Free Agent',
    })

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    const updated: Player = {
      ...player,
      name: name.trim(),
      role,
      nationality: nationality.trim(),
      teamId: selectedTeamId,
      teamName: selectedTeam?.name || player.teamName || 'Free Agent',
      avatarUrl: avatarUrl.trim() || undefined,
    }

    onSubmit(updated)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
        <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
          Edit Player Profile: {player.name}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Player Nickname / Full Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
            }}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="edit-player-role-label">Role</InputLabel>
                <Select
                  labelId="edit-player-role-label"
                  value={role}
                  label="Role"
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nationality / Region"
                value={nationality}
                onChange={(e) => {
                  setNationality(e.target.value)
                  if (errors.nationality) setErrors((prev) => ({ ...prev, nationality: '' }))
                }}
                error={Boolean(errors.nationality)}
                helperText={errors.nationality}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <FormControl fullWidth>
            <InputLabel id="edit-player-team-label">Assigned Team</InputLabel>
            <Select
              labelId="edit-player-team-label"
              value={selectedTeamId}
              label="Assigned Team"
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {availableTeams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name} ({team.shortName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ImageUploadField
            label="Player Avatar (.PNG or .JPG):"
            value={avatarUrl}
            onChange={setAvatarUrl}
            helperText="Upload official player photo/avatar in PNG or JPG format"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          sx={{
            bgcolor: '#f04b3a',
            color: '#fff',
            fontWeight: 700,
            '&:hover': { bgcolor: '#d93b2a' },
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Box>
  )
}

export function EditPlayerDialog({ open, player, availableTeams, onClose, onSubmit }: EditPlayerDialogProps) {
  if (!player) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <EditPlayerFormContent
        key={player.id}
        player={player}
        availableTeams={availableTeams}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}
