import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { getTeamSlug, MOCK_RANKING } from '../mock/data'

export function TeamLeaderboardPage() {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Top teams" />
      {MOCK_RANKING.map((team, index) => (
        <Box
          key={team}
          sx={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr',
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
          <Typography
            component={Link}
            to={`/teams/${getTeamSlug(team)}`}
            sx={{ color: 'text.primary', fontWeight: 700, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            {team}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
