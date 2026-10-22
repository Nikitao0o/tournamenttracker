import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import type { TournamentStatus } from '../../../types'

interface TournamentFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: TournamentStatus | 'All'
  onStatusChange: (status: TournamentStatus | 'All') => void
  totalCount: number
  filteredCount: number
  onReset: () => void
}

const STATUS_FILTERS: { label: string; value: TournamentStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Ongoing', value: 'Ongoing' },
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'Completed', value: 'Completed' },
]

export function TournamentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  totalCount,
  filteredCount,
  onReset,
}: TournamentFiltersProps) {
  const isFiltered = search.trim() !== '' || status !== 'All'

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderBottom: 'none',
      }}
    >
      <Stack spacing={1.5}>
        <TextField
          placeholder="Search tournaments by name or location..."
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              sx: { bgcolor: 'background.default', fontSize: 13 },
            },
          }}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {STATUS_FILTERS.map((f) => {
              const active = status === f.value
              return (
                <Chip
                  key={f.value}
                  label={f.label}
                  size="small"
                  onClick={() => onStatusChange(f.value)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    bgcolor: active ? 'secondary.main' : 'background.default',
                    color: active ? '#fff' : 'text.primary',
                    border: '1px solid',
                    borderColor: active ? 'secondary.main' : 'divider',
                    '&:hover': {
                      bgcolor: active ? 'secondary.main' : 'action.hover',
                    },
                  }}
                />
              )
            })}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
              Found: {filteredCount} of {totalCount}
            </Box>
            {isFiltered ? (
              <Button size="small" variant="text" onClick={onReset} sx={{ fontSize: 11, p: 0.5, color: 'primary.main' }}>
                Reset
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}
