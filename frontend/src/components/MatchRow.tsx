import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { Match } from '../types'
import { formatDateShort, MatchStatusLabel, ScorePair } from './StatusChips'

type MatchRowProps = {
  match: Match
}

export function MatchRow({ match }: MatchRowProps) {
  const aWon = (match.scoreA ?? 0) > (match.scoreB ?? 0)
  const bWon = (match.scoreB ?? 0) > (match.scoreA ?? 0)
  const decided = match.status === 'FINISHED'

  return (
    <Box
      component={Link}
      to={`/matches/${match.id}`}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '52px 1fr auto',
          sm: '56px minmax(0, 1.1fr) minmax(0, 1.6fr)',
        },
        alignItems: 'center',
        columnGap: 1,
        px: 1,
        py: 0.6,
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        '&:hover': { bgcolor: '#f3f5f7' },
      }}
    >
      <Box>
        {match.status === 'LIVE' ? (
          <MatchStatusLabel status="LIVE" />
        ) : (
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>
            {formatDateShort(match.date)}
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {match.tournamentName}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          columnGap: 1,
          minWidth: 0,
          gridColumn: { xs: '2 / -1', sm: 'auto' },
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: decided && aWon ? 800 : 600,
            textAlign: 'right',
            color: decided && !aWon ? 'text.secondary' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {match.teamA}
        </Typography>
        <ScorePair scoreA={match.scoreA} scoreB={match.scoreB} live={match.status === 'LIVE'} />
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: decided && bWon ? 800 : 600,
            color: decided && !bWon ? 'text.secondary' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {match.teamB}
        </Typography>
      </Box>
    </Box>
  )
}
