import { useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
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
import { Link } from 'react-router-dom'
import type { Match, MatchStatus } from '../../types'
import { MOCK_MATCHES, MOCK_TOURNAMENTS, getAllTeamNames } from '../../mock/data'
import { TeamLogo } from '../../shared/ui/TeamLogo'
import { storage } from '../../shared/api/storage'
import { MatchStatusLabel } from '../../components/StatusChips'

const MAPS = ['Mirage', 'Inferno', 'Nuke', 'Ancient', 'Dust2', 'Anubis', 'Vertigo']

export function AdminMatchesPage() {
  const tournaments = storage.getTournaments() || MOCK_TOURNAMENTS
  const [matches, setMatches] = useState<Match[]>(() => {
    return storage.getMatches() || MOCK_MATCHES
  })

  const [filterTournament, setFilterTournament] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Edit match state
  const [editScoreA, setEditScoreA] = useState<number>(0)
  const [editScoreB, setEditScoreB] = useState<number>(0)
  const [editStatus, setEditStatus] = useState<MatchStatus>('UPCOMING')
  const [editMap, setEditMap] = useState<string>('Mirage')
  const [editTeamA, setEditTeamA] = useState<string>('')
  const [editTeamB, setEditTeamB] = useState<string>('')

  useEffect(() => {
    storage.setMatches(matches)
  }, [matches])

  const allTeams = getAllTeamNames()

  const handleOpenEdit = (m: Match) => {
    setEditingMatch(m)
    setEditScoreA(m.scoreA ?? 0)
    setEditScoreB(m.scoreB ?? 0)
    setEditStatus(m.status)
    setEditMap(m.map || 'Mirage')
    setEditTeamA(m.teamA || 'TBD')
    setEditTeamB(m.teamB || 'TBD')
  }

  const handleSaveEdit = () => {
    if (!editingMatch) return

    const updatedMatches = matches.map((m) => {
      if (m.id === editingMatch.id) {
        return {
          ...m,
          teamA: editTeamA || 'TBD',
          teamB: editTeamB || 'TBD',
          scoreA: editScoreA,
          scoreB: editScoreB,
          status: editStatus,
          map: editMap,
        }
      }
      return m
    })

    setMatches(updatedMatches)
    storage.setMatches(updatedMatches)
    setNotification(`Match #${editingMatch.id} updated successfully!`)
    setEditingMatch(null)
  }

  const filteredMatches = matches.filter((m) => {
    const matchesTourney = filterTournament === 'ALL' || m.tournamentId === filterTournament
    const matchesStat = filterStatus === 'ALL' || m.status === filterStatus
    const matchesSearch =
      search.trim() === '' ||
      (m.teamA && m.teamA.toLowerCase().includes(search.toLowerCase())) ||
      (m.teamB && m.teamB.toLowerCase().includes(search.toLowerCase())) ||
      m.tournamentName.toLowerCase().includes(search.toLowerCase())

    return matchesTourney && matchesStat && matchesSearch
  })

  return (
    <Stack spacing={2.5}>
      {/* Header bar */}
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
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Button component={Link} to="/admin" sx={{ color: '#f04b3a', p: 0, minWidth: 'auto', fontWeight: 800 }}>
              ← Admin Dashboard
            </Button>
            <Typography variant="h1" sx={{ color: '#fff', fontSize: { xs: 18, sm: 22 } }}>
              / MATCH EDITOR
            </Typography>
          </Stack>
          <Typography sx={{ color: '#9aa7b3', fontSize: 12 }}>
            Edit match scores, live statuses, maps, and bracket participants
          </Typography>
        </div>

        <Chip label={`Total matches: ${matches.length}`} sx={{ bgcolor: '#f04b3a', color: '#fff', fontWeight: 800 }} />
      </Box>

      {/* Filters bar */}
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
                  <MenuItem key={t.id} value={t.id}>
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

      {/* Matches Table */}
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
                ACTION
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMatches.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>#{m.id}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{m.tournamentName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {m.roundName || m.date || 'Regular match'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TeamLogo teamName={m.teamA} size={24} />
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
                    <TeamLogo teamName={m.teamB} size={24} />
                    <Typography sx={{ fontWeight: 700 }}>{m.teamB || 'TBD'}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <MatchStatusLabel status={m.status} />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{m.map || '—'}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenEdit(m)}
                    sx={{ fontSize: 11, fontWeight: 700 }}
                  >
                    Edit Match
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Match Dialog */}
      <Dialog open={Boolean(editingMatch)} onClose={() => setEditingMatch(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
            Edit Match #{editingMatch?.id}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Event: <strong>{editingMatch?.tournamentName}</strong> ({editingMatch?.roundName || 'Match'})
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-team-a-label">Team A</InputLabel>
                  <Select
                    labelId="edit-team-a-label"
                    value={editTeamA}
                    label="Team A"
                    onChange={(e) => setEditTeamA(e.target.value)}
                  >
                    <MenuItem value="TBD">TBD (Unassigned)</MenuItem>
                    {allTeams.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-team-b-label">Team B</InputLabel>
                  <Select
                    labelId="edit-team-b-label"
                    value={editTeamB}
                    label="Team B"
                    onChange={(e) => setEditTeamB(e.target.value)}
                  >
                    <MenuItem value="TBD">TBD (Unassigned)</MenuItem>
                    {allTeams.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Team A Score"
                  type="number"
                  value={editScoreA}
                  onChange={(e) => setEditScoreA(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Team B Score"
                  type="number"
                  value={editScoreB}
                  onChange={(e) => setEditScoreB(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="edit-status-label">Match Status</InputLabel>
                  <Select
                    labelId="edit-status-label"
                    value={editStatus}
                    label="Match Status"
                    onChange={(e) => setEditStatus(e.target.value as MatchStatus)}
                  >
                    <MenuItem value="UPCOMING">Upcoming</MenuItem>
                    <MenuItem value="LIVE">Live Now</MenuItem>
                    <MenuItem value="FINISHED">Finished</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="edit-map-label">Map</InputLabel>
                  <Select
                    labelId="edit-map-label"
                    value={editMap}
                    label="Map"
                    onChange={(e) => setEditMap(e.target.value)}
                  >
                    {MAPS.map((mapName) => (
                      <MenuItem key={mapName} value={mapName}>
                        {mapName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outlined" color="inherit" onClick={() => setEditingMatch(null)}>
            Cancel
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
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert onClose={() => setNotification(null)} severity="success" sx={{ width: '100%' }}>
            {notification}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  )
}
