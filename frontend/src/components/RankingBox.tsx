import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { apiClient } from '../shared/api/client'
import type { LeaderboardTeam } from '../types'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { SectionHeader } from './SectionHeader'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'

export function RankingBox() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    apiClient
      .getTeamLeaderboards()
      .then((data) => {
        if (mounted) {
          setTeams(data.slice(0, 10))
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <SectionHeader title="World Ranking" />
      {isLoading ? (
        <Box sx={{ p: 1.5 }}>
          <CardSkeleton count={4} />
        </Box>
      ) : teams.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            No rankings available.
          </Typography>
        </Box>
      ) : (
        teams.map((team, index) => (
          <Box
            key={team.teamId}
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
            <TeamLogo teamName={team.name} logoUrl={team.logoUrl} size={20} />
            <Typography
              component={Link}
              to={`/teams/${team.teamId}`}
              sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {team.name}
            </Typography>
            {team.points && (
              <Typography sx={{ ml: 'auto', color: 'text.secondary', fontSize: 11, fontWeight: 600 }}>
                {team.points} pts
              </Typography>
            )}
          </Box>
        ))
      )}
    </Box>
  )
}
