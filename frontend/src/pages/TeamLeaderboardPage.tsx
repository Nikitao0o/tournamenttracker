import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { apiClient } from '../shared/api/client'
import type { LeaderboardTeam } from '../types'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'

export function TeamLeaderboardPage() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiClient
      .getTeamLeaderboards()
      .then((data) => {
        if (mounted) {
          setTeams(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load team rankings')
          setIsLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="Top teams (Global Standing)" />

      {error && <Alert severity="warning">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 100px 100px',
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
        <span>Team</span>
        <span style={{ textAlign: 'center' }}>Points</span>
        <span style={{ textAlign: 'center' }}>Win Rate</span>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 2 }}>
          <CardSkeleton count={4} />
        </Box>
      ) : teams.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No team leaderboard data available.</Typography>
        </Box>
      ) : (
        teams.map((team) => (
          <Box
            key={team.teamId}
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 100px 100px',
              gap: 1,
              alignItems: 'center',
              px: 2,
              py: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: '#f8fafc' },
            }}
          >
            <Typography color="text.secondary" sx={{ fontWeight: 800, fontSize: 13 }}>
              {team.rank}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <TeamLogo teamName={team.name} logoUrl={team.logoUrl} size={28} />
              <Typography
                component={Link}
                to={`/teams/${team.teamId}`}
                sx={{
                  color: 'text.primary',
                  fontWeight: 800,
                  fontSize: 15,
                  textDecoration: 'none',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {team.name}
              </Typography>
            </Stack>
            <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
              {team.points} pts
            </Typography>
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
              {team.winRate ? `${team.winRate}%` : 'N/A'}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  )
}
