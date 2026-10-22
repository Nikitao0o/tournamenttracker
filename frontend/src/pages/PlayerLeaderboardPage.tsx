import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { getTeamSlug, MOCK_PLAYER_RANKINGS } from '../mock/data'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { TeamLogo } from '../shared/ui/TeamLogo'

export function PlayerLeaderboardPage() {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Top players" />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '36px minmax(0, 1.2fr) minmax(0, 1fr) 72px',
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
      {MOCK_PLAYER_RANKINGS.map((player, index) => (
        <Box
          key={player.name}
          sx={{
            display: 'grid',
            gridTemplateColumns: '36px minmax(0, 1.2fr) minmax(0, 1fr) 72px',
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
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <PlayerAvatar name={player.name} size={24} />
            <Typography sx={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.name}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <TeamLogo teamName={player.team} size={18} />
            <Typography
              component={Link}
              to={`/teams/${getTeamSlug(player.team)}`}
              sx={{
                color: 'text.primary',
                textDecoration: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 13,
                fontWeight: 600,
                '&:hover': { color: 'primary.main' },
              }}
            >
              {player.team}
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>{player.rating}</Typography>
        </Box>
      ))}
    </Box>
  )
}
