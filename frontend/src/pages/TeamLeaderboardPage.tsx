import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { getTeamLeaderboard } from '../api/client'
import { useApi } from '../api/useApi'
import { ApiState } from '../components/ApiState'

export function TeamLeaderboardPage() {
  const { data, loading, error } = useApi(getTeamLeaderboard)
  if (loading || error) return <ApiState loading={loading} error={error} />
  if (!data) return null

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Top teams" />
      {data.map((team) => (
        <Box
          key={team.teamId}
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
            {team.rank}
          </Typography>
          <Typography
            component={Link}
            to={`/teams/${team.teamId}`}
            sx={{ color: 'text.primary', fontWeight: 700, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            {team.name}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
