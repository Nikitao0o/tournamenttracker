import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { apiClient } from '../shared/api/client'
import { useAuth } from '../app/providers/useAuth'
import type { Team } from '../types'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'
import { EditTeamDialog } from '../features/manage-teams/ui/EditTeamDialog'

export function TeamsPage() {
  const { isAdmin } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    apiClient
      .getTeams()
      .then((data) => {
        if (mounted) {
          setTeams(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load teams')
          setIsLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Stack spacing={2.5}>
      <Typography variant="h1">Teams</Typography>

      {error && <Alert severity="warning">{error}</Alert>}

      {isLoading ? (
        <Stack spacing={2}>
          <CardSkeleton count={3} />
        </Stack>
      ) : teams.length === 0 ? (
        <Alert severity="info">No teams found in database.</Alert>
      ) : (
        teams.map((team) => (
          <Paper key={team.id} variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <TeamLogo teamName={team.name} logoUrl={team.logoUrl} size={48} />
                  <div>
                    <Typography variant="h2" sx={{ fontSize: { xs: 22, sm: 28 } }}>
                      {team.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {team.region} • #{team.ranking}
                    </Typography>
                  </div>
                </Stack>
                <Chip label={team.shortName} color="secondary" sx={{ alignSelf: 'flex-start' }} />
              </Stack>

              <Typography color="text.secondary">{team.description}</Typography>

              {team.roster && team.roster.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {team.roster.map((playerName) => (
                    <Chip key={`${team.id}-${playerName}`} label={playerName} variant="outlined" size="small" />
                  ))}
                </Stack>
              )}

              <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
                <Button component={Link} to={`/teams/${team.id}`} variant="contained">
                  View team
                </Button>
                {isAdmin ? (
                  <Button
                    variant="outlined"
                    onClick={() => setEditingTeam(team)}
                    sx={{ borderColor: '#f04b3a', color: '#f04b3a' }}
                  >
                    ✏ Edit
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))
      )}

      {isAdmin && (
        <EditTeamDialog
          open={Boolean(editingTeam)}
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSubmit={async (updated) => {
            try {
              const res = await apiClient.updateTeam(updated.id, {
                name: updated.name,
                shortName: updated.shortName,
                region: updated.region,
                coach: updated.coach,
                ranking: updated.ranking,
                description: updated.description,
                logoUrl: updated.logoUrl || undefined,
              })
              setTeams((prev) => prev.map((t) => (t.id === res.id ? res : t)))
              setEditingTeam(null)
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Failed to update team')
            }
          }}
        />
      )}
    </Stack>
  )
}
