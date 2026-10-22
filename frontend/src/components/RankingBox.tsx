import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { getTeamSlug, MOCK_RANKING } from '../mock/data'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { SectionHeader } from './SectionHeader'

export function RankingBox() {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Ranking" />
      {MOCK_RANKING.map((team, index) => (
        <Box
          key={team}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1.25,
            py: 0.7,
            borderBottom: '1px solid',
            borderColor: 'divider',
            fontSize: 13,
          }}
        >
          <Typography sx={{ width: 18, color: 'text.secondary', fontWeight: 700 }}>
            {index + 1}.
          </Typography>
          <TeamLogo teamName={team} size={20} />
          <Typography
            component={Link}
            to={`/teams/${getTeamSlug(team)}`}
            sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            {team}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
