import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { MatchStatus, TournamentStatus } from '../types'

export function MatchStatusLabel({ status }: { status: MatchStatus }) {
  if (status === 'LIVE') {
    return (
      <Typography
        component="span"
        sx={{ color: 'error.main', fontWeight: 800, fontSize: 11, letterSpacing: 0.6 }}
      >
        LIVE
      </Typography>
    )
  }

  return (
    <Typography component="span" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 700 }}>
      {status === 'UPCOMING' ? 'UPCOMING' : 'FNS'}
    </Typography>
  )
}

export function TournamentStatusLabel({ status }: { status: TournamentStatus }) {
  const color =
    status === 'Ongoing' ? 'error.main' : status === 'Upcoming' ? 'primary.main' : 'text.secondary'

  return (
    <Typography component="span" sx={{ color, fontSize: 11, fontWeight: 700 }}>
      {status.toUpperCase()}
    </Typography>
  )
}

export function ScorePair({
  scoreA,
  scoreB,
  live = false,
}: {
  scoreA?: number
  scoreB?: number
  live?: boolean
}) {
  if (scoreA === undefined || scoreB === undefined) {
    return (
      <Typography sx={{ minWidth: 40, textAlign: 'center', color: 'text.secondary', fontWeight: 700 }}>
        vs
      </Typography>
    )
  }

  const aWon = scoreA > scoreB
  const bWon = scoreB > scoreA

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minWidth: 44,
        bgcolor: live ? 'error.main' : 'secondary.main',
        color: '#fff',
        fontWeight: 800,
        fontSize: 13,
        lineHeight: '22px',
        textAlign: 'center',
      }}
    >
      <Box sx={{ opacity: aWon || !bWon ? 1 : 0.55 }}>{scoreA}</Box>
      <Box sx={{ opacity: bWon || !aWon ? 1 : 0.55 }}>{scoreB}</Box>
    </Box>
  )
}
