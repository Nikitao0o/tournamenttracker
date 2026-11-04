import { useState, useEffect, useCallback } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
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
import type { Match, MatchStatus, Player, Tournament } from '../../types'
import { apiClient } from '../../shared/api/client'
import { getErrorMessage } from '../../shared/api/errors'
import { TeamLogo } from '../../shared/ui/TeamLogo'
import { MatchStatusLabel } from '../../components/StatusChips'
import { DeleteConfirmDialog } from '../../features/manage-tournaments/ui/DeleteConfirmDialog'

const CS_MAPS = ['Mirage', 'Inferno', 'Nuke', 'Ancient', 'Dust2', 'Anubis', 'Vertigo']

export function AdminMatchesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [filterTournament, setFilterTournament] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null)
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  // Edit form state
  const [editScoreA, setEditScoreA] = useState<number>(0)
  const [editScoreB, setEditScoreB] = useState<number>(0)
  const [editStatus, setEditStatus] = useState<MatchStatus>('UPCOMING')
  const [editMap, setEditMap] = useState<string>('Mirage')

  // Map result creation state
  const [newMapNumber, setNewMapNumber] = useState<number>(1)
  const [newMapName, setNewMapName] = useState<string>('Mirage')
  const [newMapScoreA, setNewMapScoreA] = useState<number>(13)
  const [newMapScoreB, setNewMapScoreB] = useState<number>(9)

  // Player stat creation state
  const [newStatPlayerId, setNewStatPlayerId] = useState<number | ''>('')
  const [newStatKills, setNewStatKills] = useState<number>(18)
  const [newStatDeaths, setNewStatDeaths] = useState<number>(12)
  const [newStatAssists, setNewStatAssists] = useState<number>(4)
  const [newStatAdr, setNewStatAdr] = useState<number>(85.0)
  const [newStatRating, setNewStatRating] = useState<number>(1.25)

  const reloadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [tList, pList, mList] = await Promise.all([
        apiClient.getTournaments(),
        apiClient.getPlayers(),
        apiClient.getMatches({
          tournamentId: filterTournament !== 'ALL' ? Number(filterTournament) : undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
        }),
      ])
      setTournaments(tList)
      setPlayers(pList)
      setMatches(mList)
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
    ])
      .then(([tList, pList, mList]) => {
        if (active) {
          setTournaments(tList)
          setPlayers(pList)
          setMatches(mList)
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

  const handleOpenEdit = async (m: Match) => {
    try {
      const freshMatch = await apiClient.getMatch(m.id)
      setEditingMatch(freshMatch)
      setEditScoreA(freshMatch.scoreA ?? 0)
      setEditScoreB(freshMatch.scoreB ?? 0)
      setEditStatus(freshMatch.status)
      setEditMap(freshMatch.map || 'Mirage')
      setNewMapNumber((freshMatch.mapResults?.length ?? 0) + 1)
      setNewMapName('Mirage')
    } catch {
      setEditingMatch(m)
      setEditScoreA(m.scoreA ?? 0)
      setEditScoreB(m.scoreB ?? 0)
      setEditStatus(m.status)
      setEditMap(m.map || 'Mirage')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMatch) return

    try {
      const updated = await apiClient.updateMatch(Number(editingMatch.id), {
        score_a: editScoreA,
        score_b: editScoreB,
        status: editStatus,
        map_name: editMap,
      })

      setMatches((prev) => prev.map((m) => (m.id === String(updated.id) ? updated : m)))
      setNotification({ message: `Match #${updated.id} updated successfully!`, severity: 'success' })
      setEditingMatch(null)
    } catch (err) {
      setNotification({ message: getErrorMessage(err), severity: 'error' })
    }
  }

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

  const handleAddMap = async () => {
    if (!editingMatch) return
    try {
      const winnerId =
        newMapScoreA > newMapScoreB
          ? editingMatch.teamAId
          : newMapScoreB > newMapScoreA
            ? editingMatch.teamBId
            : null

      await apiClient.addMatchMap(editingMatch.id, {
        map_number: newMapNumber,
        map_name: newMapName,
        score_a: newMapScoreA,
        score_b: newMapScoreB,
        winner_id: winnerId,
      })
      const fresh = await apiClient.getMatch(editingMatch.id)
      setEditingMatch(fresh)
      setMatches((prev) => prev.map((m) => (m.id === String(fresh.id) ? fresh : m)))
      setNewMapNumber((fresh.mapResults?.length ?? 0) + 1)
      setNotification({ message: `Map ${newMapName} added successfully!`, severity: 'success' })
    } catch (err) {
      setNotification({ message: getErrorMessage(err), severity: 'error' })
    }
  }

  const handleDeleteMap = async (mapId: number) => {
    if (!editingMatch) return
    try {
      await apiClient.deleteMatchMap(editingMatch.id, mapId)
      const fresh = await apiClient.getMatch(editingMatch.id)
      setEditingMatch(fresh)
      setMatches((prev) => prev.map((m) => (m.id === String(fresh.id) ? fresh : m)))
      setNotification({ message: 'Map deleted successfully!', severity: 'success' })
    } catch (err) {
      setNotification({ message: getErrorMessage(err), severity: 'error' })
    }
  }

  const handleAddPlayerStat = async () => {
    if (!editingMatch || !newStatPlayerId) return
    const selectedPlayer = players.find((p) => Number(p.id) === Number(newStatPlayerId))
    if (!selectedPlayer) return

    try {
      await apiClient.addPlayerMatchStat(editingMatch.id, {
        player_id: Number(selectedPlayer.id),
        team_id: Number(selectedPlayer.teamId),
        kills: newStatKills,
        deaths: newStatDeaths,
        assists: newStatAssists,
        headshots: Math.round(newStatKills * 0.4),
        adr: newStatAdr,
        kast: 72.0,
        rating: newStatRating,
        is_mvp: newStatRating >= 1.35,
      })
      const fresh = await apiClient.getMatch(editingMatch.id)
      setEditingMatch(fresh)
      setMatches((prev) => prev.map((m) => (m.id === String(fresh.id) ? fresh : m)))
      setNotification({ message: `Player statistics recorded!`, severity: 'success' })
    } catch (err) {
      setNotification({ message: getErrorMessage(err), severity: 'error' })
    }
  }

  const handleDeletePlayerStat = async (statId: number) => {
    if (!editingMatch) return
    try {
      await apiClient.deletePlayerMatchStat(editingMatch.id, statId)
      const fresh = await apiClient.getMatch(editingMatch.id)
      setEditingMatch(fresh)
      setMatches((prev) => prev.map((m) => (m.id === String(fresh.id) ? fresh : m)))
      setNotification({ message: 'Player stat removed', severity: 'success' })
    } catch (err) {
      setNotification({ message: getErrorMessage(err), severity: 'error' })
    }
  }

  const filteredMatches = matches.filter((m) => {
    const matchesTourney = filterTournament === 'ALL' || String(m.tournamentId) === filterTournament
    const matchesStat = filterStatus === 'ALL' || m.status === filterStatus
    const matchesSearch =
      search.trim() === '' ||
      (m.teamA && m.teamA.toLowerCase().includes(search.toLowerCase())) ||
      (m.teamB && m.teamB.toLowerCase().includes(search.toLowerCase())) ||
      Boolean(m.tournamentName && m.tournamentName.toLowerCase().includes(search.toLowerCase()))

    return matchesTourney && matchesStat && matchesSearch
  })

  // Filter players belonging to participating teams
  const matchPlayers = players.filter((p) => {
    if (!editingMatch) return false
    return (
      (editingMatch.teamAId && Number(p.teamId) === Number(editingMatch.teamAId)) ||
      (editingMatch.teamBId && Number(p.teamId) === Number(editingMatch.teamBId))
    )
  })

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          bgcolor: 'secondary.main',
          color: '#fff',
          p: { xs: 2, sm: 3 },
          border: '1px solid #30343b',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { sm: 'center' },
          gap: 2,
        }}
      >
        <div>
          <Breadcrumbs
            separator="/"
            aria-label="breadcrumb"
            sx={{
              color: '#fff',
              mb: 0.5,
              '& .MuiBreadcrumbs-separator': { color: '#9aa7b3' },
            }}
          >
            <MuiLink
              component={RouterLink}
              to="/admin"
              underline="hover"
              sx={{
                color: '#f04b3a',
                fontWeight: 800,
                fontSize: { xs: 18, sm: 22 },
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Admin
            </MuiLink>
            <Typography variant="h1" sx={{ color: '#fff', fontSize: { xs: 18, sm: 22 }, fontWeight: 800 }}>
              Match Editor
            </Typography>
          </Breadcrumbs>
          <Typography sx={{ color: '#9aa7b3', fontSize: 12 }}>
            Manage match scores, live statuses, maps, HLTV player stats, and brackets via real backend API
          </Typography>
        </div>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={reloadData}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontSize: 12 }}
          >
            Refresh Data
          </Button>
          <Chip
            label={`Total matches: ${matches.length}`}
            sx={{ bgcolor: '#f04b3a', color: '#fff', fontWeight: 800 }}
          />
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              placeholder="Search by team or event..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              slotProps={{ input: { sx: { bgcolor: 'background.default' } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-tournament-label">Filter Tournament</InputLabel>
              <Select
                labelId="filter-tournament-label"
                value={filterTournament}
                label="Filter Tournament"
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
              <InputLabel id="filter-status-label">Match Status</InputLabel>
              <Select
                labelId="filter-status-label"
                value={filterStatus}
                label="Match Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="UPCOMING">Upcoming</MenuItem>
                <MenuItem value="LIVE">Live Now</MenuItem>
                <MenuItem value="FINISHED">Finished</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'secondary.main' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>TOURNAMENT & ROUND</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>TEAM A</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>
                SCORE
              </TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>TEAM B</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>STATUS</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>MAP</TableCell>
              <TableCell align="right" sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Loading matches from API...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredMatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No matches found matching filter criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMatches.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>#{m.id}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{m.tournamentName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {m.roundName || m.date || 'Match'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <TeamLogo teamName={m.teamA} logoUrl={m.teamALogoUrl} size={24} />
                      <Typography sx={{ fontWeight: 700 }}>{m.teamA || 'TBD'}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: m.status === 'LIVE' ? 'rgba(240,75,58,0.1)' : 'background.default',
                        borderRadius: 1,
                        fontWeight: 900,
                        fontSize: 14,
                        display: 'inline-block',
                        border: '1px solid',
                        borderColor: m.status === 'LIVE' ? '#f04b3a' : 'divider',
                      }}
                    >
                      {m.scoreA ?? 0} : {m.scoreB ?? 0}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <TeamLogo teamName={m.teamB} logoUrl={m.teamBLogoUrl} size={24} />
                      <Typography sx={{ fontWeight: 700 }}>{m.teamB || 'TBD'}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <MatchStatusLabel status={m.status} />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{m.map || '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenEdit(m)}
                        sx={{ fontSize: 11, fontWeight: 700 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setDeletingMatch(m)}
                        sx={{ fontSize: 11, fontWeight: 700 }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Match Edit Dialog with Map Results & Player Stats */}
      <Dialog
        open={Boolean(editingMatch)}
        onClose={() => setEditingMatch(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
            Edit Match #{editingMatch?.id}: {editingMatch?.teamA} vs {editingMatch?.teamB}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* General Match Details */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              General Match Score & Status
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label={`${editingMatch?.teamA || 'Team A'} Score`}
                  type="number"
                  value={editScoreA}
                  onChange={(e) => setEditScoreA(Number(e.target.value))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label={`${editingMatch?.teamB || 'Team B'} Score`}
                  type="number"
                  value={editScoreB}
                  onChange={(e) => setEditScoreB(Number(e.target.value))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-status-label">Status</InputLabel>
                  <Select
                    labelId="edit-status-label"
                    value={editStatus}
                    label="Status"
                    onChange={(e) => setEditStatus(e.target.value as MatchStatus)}
                  >
                    <MenuItem value="UPCOMING">Upcoming</MenuItem>
                    <MenuItem value="LIVE">Live Now</MenuItem>
                    <MenuItem value="FINISHED">Finished</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-map-label">Current Map</InputLabel>
                  <Select
                    labelId="edit-map-label"
                    value={editMap}
                    label="Current Map"
                    onChange={(e) => setEditMap(e.target.value)}
                  >
                    {CS_MAPS.map((mapName) => (
                      <MenuItem key={mapName} value={mapName}>
                        {mapName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider />

            {/* Map Breakdown Section */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              Map Results (Score Breakdown)
            </Typography>

            {editingMatch?.mapResults && editingMatch.mapResults.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Map Name</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Winner</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editingMatch.mapResults.map((mr) => (
                    <TableRow key={mr.id}>
                      <TableCell>{mr.mapNumber}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{mr.mapName}</TableCell>
                      <TableCell>
                        {mr.scoreA} : {mr.scoreB}
                      </TableCell>
                      <TableCell>{mr.winnerName || '—'}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMap(mr.id)}
                          sx={{ fontSize: 10 }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No individual maps added yet.
              </Typography>
            )}

            {/* Add Map Controls */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 1.5 }}>
                ADD MAP RESULT:
              </Typography>
              <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 3, sm: 2 }}>
                  <TextField
                    label="Map #"
                    type="number"
                    size="small"
                    value={newMapNumber}
                    onChange={(e) => setNewMapNumber(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 5, sm: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="new-map-name-label">Map</InputLabel>
                    <Select
                      labelId="new-map-name-label"
                      value={newMapName}
                      label="Map"
                      onChange={(e) => setNewMapName(e.target.value)}
                    >
                      {CS_MAPS.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 2, sm: 2 }}>
                  <TextField
                    label="Team A"
                    type="number"
                    size="small"
                    value={newMapScoreA}
                    onChange={(e) => setNewMapScoreA(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 2, sm: 2 }}>
                  <TextField
                    label="Team B"
                    type="number"
                    size="small"
                    value={newMapScoreB}
                    onChange={(e) => setNewMapScoreB(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleAddMap}
                    fullWidth
                    sx={{ bgcolor: '#242832', color: '#fff', '&:hover': { bgcolor: '#1a1d24' } }}
                  >
                    + Add Map
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <Divider />

            {/* Player Stats Section */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
              Player Match Statistics (HLTV Rating)
            </Typography>

            {editingMatch?.playerStats && editingMatch.playerStats.length > 0 ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>K - D</TableCell>
                    <TableCell>ADR</TableCell>
                    <TableCell>Rating 2.0</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editingMatch.playerStats.map((st) => (
                    <TableRow key={st.id}>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {st.playerNickname} {st.isMvp ? '⭐ MVP' : ''}
                      </TableCell>
                      <TableCell>{st.teamName}</TableCell>
                      <TableCell>
                        {st.kills} - {st.deaths}
                      </TableCell>
                      <TableCell>{st.adr}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: st.rating >= 1.2 ? 'success.main' : 'inherit' }}>
                        {st.rating.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeletePlayerStat(st.id)}
                          sx={{ fontSize: 10 }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No player statistics recorded for this match yet.
              </Typography>
            )}

            {/* Add Player Stat Controls */}
            {matchPlayers.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 1.5 }}>
                  RECORD PLAYER PERFORMANCE:
                </Typography>
                <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="stat-player-select">Select Player</InputLabel>
                      <Select
                        labelId="stat-player-select"
                        value={newStatPlayerId}
                        label="Select Player"
                        onChange={(e) => setNewStatPlayerId(Number(e.target.value))}
                      >
                        {matchPlayers.map((p) => (
                          <MenuItem key={p.id} value={Number(p.id)}>
                            {p.nickname || p.name} ({p.teamName})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1.5 }}>
                    <TextField
                      label="Kills"
                      type="number"
                      size="small"
                      value={newStatKills}
                      onChange={(e) => setNewStatKills(Number(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1.5 }}>
                    <TextField
                      label="Deaths"
                      type="number"
                      size="small"
                      value={newStatDeaths}
                      onChange={(e) => setNewStatDeaths(Number(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1.5 }}>
                    <TextField
                      label="Assists"
                      type="number"
                      size="small"
                      value={newStatAssists}
                      onChange={(e) => setNewStatAssists(Number(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1.5 }}>
                    <TextField
                      label="ADR"
                      type="number"
                      size="small"
                      value={newStatAdr}
                      onChange={(e) => setNewStatAdr(Number(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 3, sm: 1.5 }}>
                    <TextField
                      label="Rating"
                      type="number"
                      size="small"
                      value={newStatRating}
                      onChange={(e) => setNewStatRating(Number(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1.5 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAddPlayerStat}
                      disabled={!newStatPlayerId}
                      fullWidth
                      sx={{ bgcolor: '#242832', color: '#fff', '&:hover': { bgcolor: '#1a1d24' }, height: 40 }}
                    >
                      + Record
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outlined" color="inherit" onClick={() => setEditingMatch(null)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            sx={{
              bgcolor: '#f04b3a',
              color: '#fff',
              fontWeight: 700,
              '&:hover': { bgcolor: '#d93b2a' },
            }}
          >
            Save Match Score & Status
          </Button>
        </DialogActions>
      </Dialog>

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
