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
import type { CreatePlayerInput, Team } from '../../../types'

interface CreatePlayerDialogProps {
  open: boolean
  availableTeams: Team[]
  onClose: () => void
  onSubmit: (player: CreatePlayerInput) => void
}

const ROLES = ['Entry Fragger', 'AWPer', 'IGL', 'Support', 'Lurker']

export function CreatePlayerDialog({ open, availableTeams, onClose, onSubmit }: CreatePlayerDialogProps) {
  const [name, setName] = useState('')
  const [age, setAge] = useState(20)
  const [role, setRole] = useState('Entry Fragger')
  const [nationality, setNationality] = useState('European')
  const [selectedTeamId, setSelectedTeamId] = useState(availableTeams[0]?.id || 'team-spirit')
  const [kd, setKd] = useState('1.15')
  const [impact, setImpact] = useState(8.5)
  const [maps, setMaps] = useState(45)
  const [avatarUrl, setAvatarUrl] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedTeam = availableTeams.find((t) => t.id === selectedTeamId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validatePlayerForm({
      name,
      role,
      nationality,
      teamName: selectedTeam?.name || 'Free Agent',
    })

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    const playerId = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')

    onSubmit({
      id: playerId,
      name: name.trim(),
      age: Number(age) || 20,
      role,
      nationality: nationality.trim(),
      teamId: selectedTeamId,
      teamName: selectedTeam?.name || 'Free Agent',
      avatarUrl: avatarUrl || undefined,
      stats: {
        kd: kd.trim() || '1.00',
        impact: Number(impact) || 8.0,
        maps: Number(maps) || 30,
      },
    })

    // Reset
    setName('')
    setAge(20)
    setRole('Entry Fragger')
    setNationality('European')
    setKd('1.15')
    setImpact(8.5)
    setMaps(45)
    setAvatarUrl('')
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
            Create New Player
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Player Nickname / Full Name"
                  placeholder="e.g. m0NESY (Ilya Osipov)"
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
                  <InputLabel id="player-role-label">Role</InputLabel>
                  <Select
                    labelId="player-role-label"
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
                  placeholder="e.g. Ukrainian, French, Danish"
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
              <InputLabel id="player-team-label">Assigned Team</InputLabel>
              <Select
                labelId="player-team-label"
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
            Create Player
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
