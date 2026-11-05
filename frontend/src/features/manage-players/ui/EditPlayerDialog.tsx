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
  const [nickname, setNickname] = useState(() => player.nickname || player.name)
  const [name, setName] = useState(() => player.name)
  const [age, setAge] = useState<number | ''>(() => (typeof player.age === 'number' ? player.age : 20))
  const [role, setRole] = useState(() => player.role || 'Rifler')
  const [nationality, setNationality] = useState(() => player.nationality || '')
  const [selectedTeamId, setSelectedTeamId] = useState(() => player.teamId || '')
  const [kd, setKd] = useState(() => player.stats?.kd || '1.00')
  const [impact, setImpact] = useState<number | ''>(() => (player.stats?.impact !== undefined ? player.stats.impact : 1.0))
  const [maps, setMaps] = useState<number | ''>(() => (player.stats?.maps !== undefined ? player.stats.maps : 0))
  const [avatarUrl, setAvatarUrl] = useState(() => player.avatarUrl || '')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedTeam = availableTeams.find((t) => String(t.id) === String(selectedTeamId))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validatePlayerForm({
      nickname,
      name,
      role,
      nationality,
      teamName: selectedTeam?.name || 'Free Agent',
    })

    if (age !== '' && (age < 10 || age > 100)) {
      formErrors.age = 'Age must be between 10 and 100'
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    const updated: Player = {
      ...player,
      nickname: nickname.trim(),
      name: name.trim(),
      age: typeof age === 'number' ? age : 20,
      role,
      nationality: nationality.trim(),
      teamId: selectedTeamId ? String(selectedTeamId) : '',
      teamName: selectedTeam?.name || 'Free Agent',
      avatarUrl: avatarUrl.trim() || undefined,
      stats: {
        ...player.stats,
        kd: kd.trim() || '1.00',
        impact: typeof impact === 'number' ? impact : 1.0,
        maps: typeof maps === 'number' ? maps : 0,
      },
    }

    onSubmit(updated)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
        <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
          Edit Player Profile: {nickname}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nickname / Никнейм"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  if (errors.nickname) setErrors((prev) => ({ ...prev, nickname: '' }))
                }}
                error={Boolean(errors.nickname)}
                helperText={errors.nickname}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Full Name / Настоящее имя"
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
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Age (10-100)"
                type="number"
                slotProps={{ htmlInput: { min: 10, max: 100 } }}
                value={age}
                onChange={(e) =>
                  setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                error={Boolean(errors.age)}
                helperText={errors.age}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
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
            <Grid size={{ xs: 12, sm: 4 }}>
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
              <MenuItem value="">
                <em>Free Agent / Unassigned</em>
              </MenuItem>
              {availableTeams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name} ({team.shortName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', pt: 1 }}>
            Player Career Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="K/D Ratio"
                placeholder="1.25"
                value={kd}
                onChange={(e) => setKd(e.target.value)}
                helperText="e.g. 1.25"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Impact Rating"
                type="number"
                slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                value={impact}
                onChange={(e) =>
                  setImpact(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                helperText="e.g. 1.30"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Maps Played"
                type="number"
                slotProps={{ htmlInput: { min: 0 } }}
                value={maps}
                onChange={(e) =>
                  setMaps(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                helperText="Total maps count"
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
