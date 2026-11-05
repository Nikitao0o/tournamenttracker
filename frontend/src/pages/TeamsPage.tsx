import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { apiClient } from '../shared/api/client'
import { useAuth } from '../app/providers/useAuth'
import type { Team } from '../types'
import { TeamLogo } from '../shared/ui/TeamLogo'
import { CardSkeleton } from '../shared/ui/LoadingSkeleton'
import { EmptyState } from '../shared/ui/EmptyState'
import { EditTeamDialog } from '../features/manage-teams/ui/EditTeamDialog'

export function TeamsPage() {
  const { isAdmin } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [search, setSearch] = useState('')
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

  const filteredTeams = teams.filter((team) => {
    if (!search.trim()) return true
    const term = search.toLowerCase().trim()
    return (
      team.name.toLowerCase().includes(term) ||
      team.shortName.toLowerCase().includes(term) ||
      team.region.toLowerCase().includes(term) ||
      (team.roster && team.roster.some((p) => p.toLowerCase().includes(term)))
    )
  })

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <div>
          <Typography variant="h1">Teams</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.3 }}>
            Professional esports rosters, team rankings, and regions
          </Typography>
        </div>
        <Chip
          label={`${filteredTeams.length} of ${teams.length} teams`}
          size="small"
          variant="outlined"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontWeight: 700 }}
        />
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
        <TextField
          placeholder="Search teams by name, short tag, or region..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="span" sx={{ display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </Box>
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => setSearch('')}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: 11, color: 'text.secondary', fontWeight: 700 }}
                  >
                    Clear
                  </Button>
                </InputAdornment>
              ) : null,
              sx: { bgcolor: 'background.default', fontSize: 13 },
            },
          }}
        />
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      {isLoading ? (
        <Stack spacing={2}>
          <CardSkeleton count={3} />
        </Stack>
      ) : teams.length === 0 ? (
        <Alert severity="info">No teams found in database.</Alert>
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          title="No teams match your search"
          description={`No teams found for "${search}". Try searching for another team name or short tag.`}
          actionLabel="Clear search"
          onAction={() => setSearch('')}
        />
      ) : (
        filteredTeams.map((team) => (
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
