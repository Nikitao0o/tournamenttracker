import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { Tournament } from '../types'
import { TournamentStatusLabel } from './StatusChips'
import { formatDateShort } from '../utils/formatting'

type TournamentCardProps = {
  tournament: Tournament
  onEdit?: (tournament: Tournament) => void
}

export function TournamentCard({ tournament, onEdit }: TournamentCardProps) {
  return (
    <Box
      component={Link}
      to={`/tournaments/${tournament.id}`}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr auto', sm: '1fr 110px auto' },
        gap: 1,
        alignItems: 'center',
        px: 1.25,
        py: 1,
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        '&:hover': { bgcolor: '#f3f5f7' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{tournament.title}</Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{tournament.location}</Typography>
      </Box>
      <Typography
        sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 12, color: 'text.secondary' }}
      >
        {formatDateShort(tournament.startDate)} – {formatDateShort(tournament.endDate)}
      </Typography>
      <Box sx={{ textAlign: 'right' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <div>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{tournament.prizePool}</Typography>
            <TournamentStatusLabel status={tournament.status} />
          </div>
          {onEdit && (
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(tournament)
              }}
              sx={{ minWidth: 'auto', px: 1, py: 0.2, fontSize: 11, borderColor: '#f04b3a', color: '#f04b3a' }}
            >
              ✏ Edit
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
