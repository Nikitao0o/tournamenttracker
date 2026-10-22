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
  const [age, setAge] = useState(() => player.age)
  const [role, setRole] = useState(() => player.role)
  const [nationality, setNationality] = useState(() => player.nationality)
  const [selectedTeamId, setSelectedTeamId] = useState(() => player.teamId || availableTeams[0]?.id || '')
  const [avatarUrl, setAvatarUrl] = useState(() => player.avatarUrl || storage.getPlayerAvatar(player.name) || '')
  const [kd, setKd] = useState(() => player.stats?.kd ?? '1.15')
  const [impact, setImpact] = useState(() => player.stats?.impact ?? 8.5)
  const [maps, setMaps] = useState(() => player.stats?.maps ?? 45)

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
      age: Number(age) || 20,
      role,
      nationality: nationality.trim(),
      teamId: selectedTeamId,
      teamName: selectedTeam?.name || player.teamName || 'Free Agent',
      avatarUrl: avatarUrl.trim() || undefined,
      stats: {
        kd: kd.trim() || '1.00',
        impact: Number(impact) || 8.0,
        maps: Number(maps) || 30,
      },
    }

    onSubmit(updated)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
        <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
          Edit Player: {player.name}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
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
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 14, max: 45 } }}
                fullWidth
              />
            </Grid>
          </Grid>

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
                label="Nationality"
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

          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <TextField
                label="K/D Ratio"
                value={kd}
                onChange={(e) => setKd(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                label="Impact Rating"
                type="number"
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                slotProps={{ htmlInput: { step: 0.1, min: 0, max: 15 } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                label="Maps Played"
                type="number"
                value={maps}
                onChange={(e) => setMaps(Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>

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
