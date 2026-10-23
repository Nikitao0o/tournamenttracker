import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ImageUploadField } from '../../../shared/ui/ImageUploadField'
import { validateTeamForm } from '../../../shared/utils/validation'
import type { CreateTeamInput } from '../../../types'

interface CreateTeamDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (team: CreateTeamInput) => void
}

export function CreateTeamDialog({ open, onClose, onSubmit }: CreateTeamDialogProps) {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [region, setRegion] = useState('Europe')
  const [coach, setCoach] = useState('')
  const [description, setDescription] = useState('')
  const [rosterText, setRosterText] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formErrors = validateTeamForm({ name, shortName, region })
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    const roster = rosterText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    onSubmit({
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      region: region.trim(),
      coach: coach.trim(),
      description: description.trim(),
      roster,
      logoUrl: logoUrl || undefined,
    })

    // Reset fields
    setName('')
    setShortName('')
    setRegion('Europe')
    setCoach('')
    setDescription('')
    setRosterText('')
    setLogoUrl('')
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
            Create New Team
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Team Name"
                  placeholder="e.g. Natus Vincere"
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
                  label="Short Tag"
                  placeholder="e.g. NAVI"
                  value={shortName}
                  onChange={(e) => {
                    setShortName(e.target.value)
                    if (errors.shortName) setErrors((prev) => ({ ...prev, shortName: '' }))
                  }}
                  error={Boolean(errors.shortName)}
                  helperText={errors.shortName}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Region"
                  placeholder="e.g. Europe / Americas"
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value)
                    if (errors.region) setErrors((prev) => ({ ...prev, region: '' }))
                  }}
                  error={Boolean(errors.region)}
                  helperText={errors.region}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Coach"
                  placeholder="e.g. B1ad3"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            <TextField
              label="Roster (comma-separated player nicknames)"
              placeholder="e.g. s1mple, b1t, jL, Aleksib, iM"
              value={rosterText}
              onChange={(e) => setRosterText(e.target.value)}
              helperText="Separate player names with commas"
              fullWidth
            />

            <TextField
              label="Description"
              placeholder="Team profile details..."
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />

            <ImageUploadField
              label="Team Logo (.PNG or .JPG):"
              value={logoUrl}
              onChange={setLogoUrl}
              helperText="Upload official team logo in PNG or JPG format"
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
            Create Team
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
