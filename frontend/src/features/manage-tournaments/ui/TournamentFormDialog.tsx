import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Fade from '@mui/material/Fade'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { BracketType, CreateTournamentInput, Tournament, TournamentStatus } from '../../../types'
import { validateTournamentForm } from '../../../shared/utils/validation'

interface TournamentFormDialogProps {
  open: boolean
  tournament?: Tournament | null
  onClose: () => void
  onSubmit: (data: CreateTournamentInput) => Promise<void>
}

const BRACKET_OPTIONS: { label: string; value: BracketType }[] = [
  { label: 'Double Elimination', value: 'double_elimination' },
  { label: 'Single Elimination', value: 'single_elimination' },
  { label: 'Round Robin', value: 'round_robin' },
  { label: 'Swiss System', value: 'swiss' },
]

function TournamentFormContent({
  tournament,
  onClose,
  onSubmit,
}: {
  tournament?: Tournament | null
  onClose: () => void
  onSubmit: (data: CreateTournamentInput) => Promise<void>
}) {
  const isEdit = Boolean(tournament)

  const [title, setTitle] = useState(() => tournament?.title ?? '')
  const [prizePool, setPrizePool] = useState(() => tournament?.prizePool ?? '$500,000')
  const [startDate, setStartDate] = useState(() => tournament?.startDate ?? new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(
    () => tournament?.endDate ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  )
  const [location, setLocation] = useState(() => tournament?.location ?? '')
  const [status, setStatus] = useState<TournamentStatus>(() => tournament?.status ?? 'Upcoming')
  const [bracketType, setBracketType] = useState<BracketType>(
    () => (tournament?.bracketType as BracketType) || 'double_elimination',
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validateTournamentForm({
      title,
      prizePool,
      startDate,
      endDate,
      location,
    })

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        prizePool: prizePool.trim(),
        startDate,
        endDate,
        location: location.trim(),
        status,
        bracketType,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
        <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
          {isEdit ? 'Редактирование турнира' : 'Создание нового турнира'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Название турнира"
            placeholder="e.g. BLAST Premier World Final 2026"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
            }}
            error={Boolean(errors.title)}
            helperText={errors.title}
            fullWidth
            required
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Призовой фонд"
                placeholder="$1,000,000"
                value={prizePool}
                onChange={(e) => {
                  setPrizePool(e.target.value)
                  if (errors.prizePool) setErrors((prev) => ({ ...prev, prizePool: '' }))
                }}
                error={Boolean(errors.prizePool)}
                helperText={errors.prizePool}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Локация / Город"
                placeholder="e.g. Katowice, Poland"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  if (errors.location) setErrors((prev) => ({ ...prev, location: '' }))
                }}
                error={Boolean(errors.location)}
                helperText={errors.location}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Дата начала"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (errors.startDate || errors.endDate) {
                    setErrors((prev) => ({ ...prev, startDate: '', endDate: '' }))
                  }
                }}
                error={Boolean(errors.startDate)}
                helperText={errors.startDate}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Дата окончания"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }))
                }}
                error={Boolean(errors.endDate)}
                helperText={errors.endDate}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">Статус турнира</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={status}
                  label="Статус турнира"
                  onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                >
                  <MenuItem value="Upcoming">Upcoming (Предстоящий)</MenuItem>
                  <MenuItem value="Ongoing">Ongoing (Текущий)</MenuItem>
                  <MenuItem value="Completed">Completed (Завершен)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="bracket-select-label">Формат сетки</InputLabel>
                <Select
                  labelId="bracket-select-label"
                  value={bracketType}
                  label="Формат сетки"
                  onChange={(e) => setBracketType(e.target.value as BracketType)}
                >
                  {BRACKET_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={isSubmitting} variant="outlined" color="inherit">
          Отмена
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{
            bgcolor: '#f04b3a',
            color: '#fff',
            fontWeight: 700,
            minWidth: 120,
            '&:hover': { bgcolor: '#d93b2a' },
          }}
        >
          {isSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Box>
  )
}

export function TournamentFormDialog({ open, tournament, onClose, onSubmit }: TournamentFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slots={{ transition: Fade }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 1,
            boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
            border: '1px solid #30343b',
          },
        },
      }}
    >
      {open ? (
        <TournamentFormContent
          key={tournament ? tournament.id : 'create-new'}
          tournament={tournament}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}
