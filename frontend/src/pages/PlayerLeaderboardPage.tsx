import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { apiClient } from '../shared/api/client'
import type { LeaderboardPlayer } from '../types'
import { PlayerAvatar } from '../shared/ui/PlayerAvatar'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'

export function PlayerLeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiClient
      .getPlayerLeaderboards(20)
      .then((data) => {
        if (mounted) {
          setPlayers(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load leaderboards')
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Top players (HLTV Rating 2.0)" />

      {error && <Alert severity="warning">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px minmax(0, 1.4fr) minmax(0, 1fr) 80px 80px 80px',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: '#f1f5f9',
          color: 'text.secondary',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
        }}
      >
        <span>#</span>
        <span>Player</span>
        <span>Team</span>
        <span style={{ textAlign: 'center' }}>K/D</span>
        <span style={{ textAlign: 'center' }}>ADR</span>
        <span style={{ textAlign: 'center' }}>Rating</span>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 2 }}>
          <CardSkeleton count={5} />
        </Box>
      ) : players.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No player leaderboard data available.</Typography>
        </Box>
      ) : (
        players.map((player) => (
          <Box
            key={player.playerId}
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px minmax(0, 1.4fr) minmax(0, 1fr) 80px 80px 80px',
              gap: 1,
              alignItems: 'center',
              px: 2,
              py: 1.2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: '#f8fafc' },
            }}
          >
            <Typography color="text.secondary" sx={{ fontWeight: 800, fontSize: 13 }}>
              {player.rank}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <PlayerAvatar name={player.nickname} avatarUrl={player.avatarUrl} size={28} />
              <Typography
                component={Link}
                to={`/players/${player.playerId}`}
                sx={{
                  fontWeight: 800,
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'inherit',
                  textDecoration: 'none',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {player.nickname}
              </Typography>
            </Stack>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 600 }}>
              {player.teamName}
            </Typography>
            <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: 13 }}>
              {player.kd}
            </Typography>
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
              {player.adr.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                textAlign: 'center',
                fontWeight: 900,
                fontSize: 14,
                color: player.rating >= 1.2 ? 'success.main' : (player.rating < 0.95 ? 'error.main' : 'text.primary'),
              }}
            >
              {player.rating.toFixed(2)}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  )
}
