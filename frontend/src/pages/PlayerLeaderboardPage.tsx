import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { getTeamSlug, MOCK_PLAYERS } from '../mock/data'

export function PlayerLeaderboardPage() {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Top players" />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '36px minmax(0, 1fr) minmax(0, 1fr) 72px',
          gap: 1,
          px: 1.5,
          py: 0.75,
          bgcolor: '#f3f5f7',
          color: 'text.secondary',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        <span>#</span>
        <span>Player</span>
        <span>Team</span>
        <span>Rating</span>
      </Box>
      {MOCK_PLAYERS.map((player, index) => (
        <Box
          key={player.name}
          sx={{
            display: 'grid',
            gridTemplateColumns: '36px minmax(0, 1fr) minmax(0, 1fr) 72px',
            gap: 1,
            alignItems: 'center',
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            {index + 1}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{player.name}</Typography>
          <Typography
            component={Link}
            to={`/teams/${getTeamSlug(player.team)}`}
            sx={{
              color: 'text.primary',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {player.team}
          </Typography>
          <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{player.rating.toFixed(2)}</Typography>
        </Box>
      ))}
    </Box>
  )
}
