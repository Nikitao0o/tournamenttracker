import { useState, useEffect, useCallback } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import type { Match, Player, Team, Tournament } from '../../types'
import { apiClient } from '../../shared/api/client'
import { getErrorMessage } from '../../shared/api/errors'
import { TeamLogo } from '../../shared/ui/TeamLogo'
import { MatchStatusLabel } from '../../components/StatusChips'
import { DeleteConfirmDialog } from '../../features/manage-tournaments/ui/DeleteConfirmDialog'
import { EditMatchDialog } from '../../features/manage-matches/ui/EditMatchDialog'

export function AdminMatchesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [filterTournament, setFilterTournament] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null)
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const reloadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [tList, pList, mList, teamList] = await Promise.all([
        apiClient.getTournaments(),
        apiClient.getPlayers(),
        apiClient.getMatches({
          tournamentId: filterTournament !== 'ALL' ? Number(filterTournament) : undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
        }),
        apiClient.getTeams(),
      ])
      setTournaments(tList)
      setPlayers(pList)
      setMatches(mList)
      setTeams(teamList)
    } catch (err) {
      setNotification({ message: getErrorMessage(err), severity: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [filterTournament, filterStatus])

  useEffect(() => {
    let active = true
    Promise.all([
      apiClient.getTournaments(),
      apiClient.getPlayers(),
      apiClient.getMatches({
        tournamentId: filterTournament !== 'ALL' ? Number(filterTournament) : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
      }),
      apiClient.getTeams(),
    ])
      .then(([tList, pList, mList, teamList]) => {
        if (active) {
          setTournaments(tList)
          setPlayers(pList)
          setMatches(mList)
          setTeams(teamList)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setNotification({ message: getErrorMessage(err), severity: 'error' })
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [filterTournament, filterStatus])

  const handleDeleteMatch = async () => {
    if (!deletingMatch) return
    try {
      await apiClient.deleteMatch(Number(deletingMatch.id))
      setMatches((prev) => prev.filter((m) => m.id !== deletingMatch.id))
      setNotification({ message: `Match #${deletingMatch.id} deleted successfully!`, severity: 'success' })
      setDeletingMatch(null)
    } catch (err) {
      setNotification({ message: getErrorMessage(err), severity: 'error' })
    }
  }

  const filteredMatches = matches.filter((m) => {
    const matchesTourney = filterTournament === 'ALL' || String(m.tournamentId) === filterTournament
    const matchesStat = filterStatus === 'ALL' || m.status === filterStatus
    const matchesSearch =
      search === '' ||
      m.teamA.toLowerCase().includes(search.toLowerCase()) ||
      m.teamB.toLowerCase().includes(search.toLowerCase()) ||
      (m.roundName && m.roundName.toLowerCase().includes(search.toLowerCase())) ||
      (m.tournamentName && m.tournamentName.toLowerCase().includes(search.toLowerCase()))

    return matchesTourney && matchesStat && matchesSearch
  })

  return (
    <Stack spacing={2.5}>
      <Breadcrumbs>
        <MuiLink component={RouterLink} to="/admin" underline="hover" color="inherit">
          Admin Dashboard
        </MuiLink>
        <Typography color="text.primary">Match Results & HLTV Scoreboards</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <div>
          <Typography variant="h1">Match Management</Typography>
          <Typography color="text.secondary">
            Update match scores, maps breakdown, status and detailed player statistics.
          </Typography>
        </div>
        <Button variant="outlined" onClick={reloadData} disabled={isLoading}>
          ↻ Refresh
        </Button>
      </Box>

      {/* Filters row */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-tournament-label">Filter by Tournament</InputLabel>
              <Select
                labelId="filter-tournament-label"
                value={filterTournament}
                label="Filter by Tournament"
                onChange={(e) => setFilterTournament(e.target.value)}
              >
                <MenuItem value="ALL">All Tournaments</MenuItem>
                {tournaments.map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-status-label">Filter by Status</InputLabel>
              <Select
                labelId="filter-status-label"
                value={filterStatus}
                label="Filter by Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="UPCOMING">Upcoming</MenuItem>
                <MenuItem value="LIVE">Live</MenuItem>
                <MenuItem value="FINISHED">Finished</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search team or stage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Matches list table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Tournament / Stage</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Teams & Score</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Format / Map</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Maps / Stats</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  Loading matches...
                </TableCell>
              </TableRow>
            ) : filteredMatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No matches match the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredMatches.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>#{m.id}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{m.tournamentName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.roundName || 'Single match'} • {m.date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <TeamLogo teamName={m.teamA} logoUrl={m.teamALogoUrl} size={20} />
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{m.teamA}</Typography>
                      <Chip
                        label={`${m.scoreA ?? '-'} : ${m.scoreB ?? '-'}`}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: '#e2e8f0' }}
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{m.teamB}</Typography>
                      <TeamLogo teamName={m.teamB} logoUrl={m.teamBLogoUrl} size={20} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{m.matchFormat || 'BO3'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.map || 'Mirage'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <MatchStatusLabel status={m.status} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        label={`${m.mapResults?.length || 0} maps`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                      <Chip
                        label={`${m.playerStats?.length || 0} stats`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setEditingMatch(m)}
                        sx={{
                          fontSize: 11,
                          bgcolor: '#f04b3a',
                          color: '#fff',
                          '&:hover': { bgcolor: '#d93b2a' },
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        component={RouterLink}
                        to={`/matches/${m.id}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setDeletingMatch(m)}
                        sx={{ fontSize: 11, minWidth: 'auto', px: 1 }}
                      >
                        ✕
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Reusable EditMatchDialog covering all crud.py fields, maps & stats */}
      <EditMatchDialog
        open={Boolean(editingMatch)}
        match={editingMatch}
        availableTeams={teams}
        availablePlayers={players}
        onClose={() => setEditingMatch(null)}
        onSuccess={(updated) => {
          setMatches((prev) => prev.map((m) => (m.id === String(updated.id) ? updated : m)))
          setNotification({ message: `Match #${updated.id} updated successfully!`, severity: 'success' })
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deletingMatch)}
        title={`Match #${deletingMatch?.id} (${deletingMatch?.teamA} vs ${deletingMatch?.teamB})`}
        onClose={() => setDeletingMatch(null)}
        onConfirm={handleDeleteMatch}
      />

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={3500}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert onClose={() => setNotification(null)} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  )
}
