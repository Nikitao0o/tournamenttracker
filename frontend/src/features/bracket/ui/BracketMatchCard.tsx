import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import type { BracketMatch } from '../../../types'
import { TeamLogo } from '../../../shared/ui/TeamLogo'

interface BracketMatchCardProps {
  match: BracketMatch
  width?: number | string
}

export function BracketMatchCard({ match, width = 280 }: BracketMatchCardProps) {
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE'
  const isTeamAWinner = isFinished && match.scoreA !== null && match.scoreB !== null && (match.scoreA ?? 0) > (match.scoreB ?? 0)
  const isTeamBWinner = isFinished && match.scoreA !== null && match.scoreB !== null && (match.scoreB ?? 0) > (match.scoreA ?? 0)

  const isTeamATbd = !match.teamAName || match.teamAName === 'TBD' || match.teamAName.startsWith('Winner of') || match.teamAName.startsWith('Loser of')
  const isTeamBTbd = !match.teamBName || match.teamBName === 'TBD' || match.teamBName.startsWith('Winner of') || match.teamBName.startsWith('Loser of')

  return (
    <Paper
      component={Link}
      to={`/matches/${match.id}`}
      variant="outlined"
      sx={{
        width,
        display: 'block',
        textDecoration: 'none',
        bgcolor: '#1b1e24',
        borderColor: isLive ? '#f04b3a' : '#2d323b',
        borderWidth: isLive ? 2 : 1,
        borderRadius: 1.5,
        overflow: 'hidden',
        boxShadow: isLive ? '0 0 12px rgba(240, 75, 58, 0.25)' : 'none',
        transition: 'transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          borderColor: isLive ? '#f04b3a' : '#4f5765',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        },
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          px: 1.5,
          py: 0.8,
          bgcolor: '#14161a',
          borderBottom: '1px solid #282c35',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography sx={{ color: '#8b929e', fontSize: 11, fontWeight: 700 }}>
          {match.startTime || match.date || 'TBD'}
        </Typography>

        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
          {match.matchFormat ? (
            <Chip
              label={match.matchFormat}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 800,
                bgcolor: '#252932',
                color: '#abb3c0',
                borderRadius: 0.5,
              }}
            />
          ) : null}

          {isLive ? (
            <Chip
              label="LIVE"
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 900,
                bgcolor: '#f04b3a',
                color: '#fff',
                borderRadius: 0.5,
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                  '100%': { opacity: 1 },
                },
              }}
            />
          ) : null}
        </Stack>
      </Box>

      {/* Teams list */}
      <Box sx={{ p: 1.2 }}>
        {/* Team A */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 0.6,
            px: 0.8,
            borderRadius: 1,
            bgcolor: isTeamAWinner ? 'rgba(105, 240, 174, 0.08)' : 'transparent',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flex: 1, mr: 1 }}>
            <TeamLogo
              teamName={match.teamAName}
              logoUrl={match.teamALogoUrl ?? undefined}
              size={22}
              variant="rounded"
            />
            <Typography
              noWrap
              sx={{
                fontSize: 13,
                fontWeight: isTeamAWinner ? 800 : isTeamATbd ? 400 : 600,
                color: isTeamAWinner ? '#69f0ae' : isTeamATbd ? '#717886' : '#ffffff',
                fontStyle: isTeamATbd ? 'italic' : 'normal',
              }}
            >
              {match.teamAName}
            </Typography>
          </Stack>

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              minWidth: 20,
              textAlign: 'right',
              color: isTeamAWinner ? '#69f0ae' : match.scoreA !== null && match.scoreA !== undefined ? '#d0d4dc' : '#525866',
            }}
          >
            {match.scoreA !== null && match.scoreA !== undefined ? match.scoreA : '-'}
          </Typography>
        </Box>

        {/* Team B */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 0.6,
            px: 0.8,
            borderRadius: 1,
            mt: 0.4,
            bgcolor: isTeamBWinner ? 'rgba(105, 240, 174, 0.08)' : 'transparent',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flex: 1, mr: 1 }}>
            <TeamLogo
              teamName={match.teamBName}
              logoUrl={match.teamBLogoUrl ?? undefined}
              size={22}
              variant="rounded"
            />
            <Typography
              noWrap
              sx={{
                fontSize: 13,
                fontWeight: isTeamBWinner ? 800 : isTeamBTbd ? 400 : 600,
                color: isTeamBWinner ? '#69f0ae' : isTeamBTbd ? '#717886' : '#ffffff',
                fontStyle: isTeamBTbd ? 'italic' : 'normal',
              }}
            >
              {match.teamBName}
            </Typography>
          </Stack>

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              minWidth: 20,
              textAlign: 'right',
              color: isTeamBWinner ? '#69f0ae' : match.scoreB !== null && match.scoreB !== undefined ? '#d0d4dc' : '#525866',
            }}
          >
            {match.scoreB !== null && match.scoreB !== undefined ? match.scoreB : '-'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}
