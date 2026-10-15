import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { TeamLeaderboardEntry } from '../api/client'
import { SectionHeader } from './SectionHeader'

export function RankingBox({ teams }: { teams: TeamLeaderboardEntry[] }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Ranking" />
      {teams.map((team) => (
        <Box
          key={team.teamId}
          sx={{
            display: 'flex',
            gap: 1.25,
            px: 1.25,
            py: 0.7,
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontSize: 13,
          }}
        >
          <Typography sx={{ width: 18, color: 'text.secondary', fontWeight: 700 }}>
            {team.rank}.
          </Typography>
          <Typography
            component={Link}
            to={`/teams/${team.teamId}`}
            sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            {team.name}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
