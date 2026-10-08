import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { MOCK_RANKING } from '../mock/data'
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
          <Typography sx={{ fontWeight: 700 }}>{team}</Typography>
        </Box>
      ))}
    </Box>
  )
}
