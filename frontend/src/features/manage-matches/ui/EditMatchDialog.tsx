import { useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Match, MatchFormat, MatchStatus, Player, Team } from '../../../types'
import { apiClient } from '../../../shared/api/client'
import { getErrorMessage } from '../../../shared/api/errors'

const CS_MAPS = ['Mirage', 'Inferno', 'Nuke', 'Ancient', 'Dust2', 'Anubis', 'Vertigo']
const MATCH_FORMATS: MatchFormat[] = ['BO1', 'BO3', 'BO5']
const MATCH_STATUSES: MatchStatus[] = ['UPCOMING', 'LIVE', 'FINISHED']

interface EditMatchDialogProps {
  open: boolean
  match: Match | null
  availableTeams?: Team[]
  availablePlayers?: Player[]
  onClose: () => void
  onSuccess: (updated: Match) => void
}

function EditMatchFormContent({
  match,
  availableTeams: propTeams,
  availablePlayers: propPlayers,
  onClose,
  onSuccess,
}: {
  match: Match
  availableTeams?: Team[]
  availablePlayers?: Player[]
  onClose: () => void
  onSuccess: (updated: Match) => void
}) {
  const [teams, setTeams] = useState<Team[]>(propTeams || [])
  const [players, setPlayers] = useState<Player[]>(propPlayers || [])
  const [currentMatch, setCurrentMatch] = useState<Match>(match)

  // Core match update fields
  const [scoreA, setScoreA] = useState<number>(() => match.scoreA ?? 0)
  const [scoreB, setScoreB] = useState<number>(() => match.scoreB ?? 0)
  const [status, setStatus] = useState<MatchStatus>(() => match.status || 'UPCOMING')
  const [mapName, setMapName] = useState<string>(() => match.map || 'Mirage')
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(() => (match.matchFormat as MatchFormat) || 'BO3')
  const [date, setDate] = useState<string>(() => match.date || new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState<string>(() => match.startTime || '')
  const [roundName, setRoundName] = useState<string>(() => match.roundName || '')
  const [teamAId, setTeamAId] = useState<number | ''>(() => (match.teamAId ? Number(match.teamAId) : ''))
  const [teamBId, setTeamBId] = useState<number | ''>(() => (match.teamBId ? Number(match.teamBId) : ''))
  const [winnerId, setWinnerId] = useState<number | ''>(() => (match.winnerId ? Number(match.winnerId) : ''))

  // New map state
  const [newMapNumber, setNewMapNumber] = useState<number>(() => (match.mapResults?.length ?? 0) + 1)
  const [newMapName, setNewMapName] = useState<string>('Mirage')
  const [newMapScoreA, setNewMapScoreA] = useState<number>(13)
  const [newMapScoreB, setNewMapScoreB] = useState<number>(9)

  // New stat state
  const [newStatPlayerId, setNewStatPlayerId] = useState<number | ''>('')
  const [newStatKills, setNewStatKills] = useState<number>(18)
  const [newStatDeaths, setNewStatDeaths] = useState<number>(12)
  const [newStatAssists, setNewStatAssists] = useState<number>(4)
  const [newStatAdr, setNewStatAdr] = useState<number>(85.0)
  const [newStatRating, setNewStatRating] = useState<number>(1.25)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load fresh match details, teams, players if needed
  useEffect(() => {
    let mounted = true
    apiClient
      .getMatch(match.id)
      .then((data) => {
        if (mounted) {
          setCurrentMatch(data)
          setScoreA(data.scoreA ?? 0)
          setScoreB(data.scoreB ?? 0)
          setStatus(data.status)
          setMapName(data.map || 'Mirage')
          setMatchFormat((data.matchFormat as MatchFormat) || 'BO3')
          setDate(data.date || new Date().toISOString().slice(0, 10))
          setStartTime(data.startTime || '')
          setRoundName(data.roundName || '')
          setTeamAId(data.teamAId ? Number(data.teamAId) : '')
          setTeamBId(data.teamBId ? Number(data.teamBId) : '')
          setWinnerId(data.winnerId ? Number(data.winnerId) : '')
          setNewMapNumber((data.mapResults?.length ?? 0) + 1)
        }
      })
      .catch(() => {})

    if (!propTeams || propTeams.length === 0) {
      apiClient.getTeams().then((data) => {
        if (mounted) setTeams(data)
      }).catch(() => {})
    }

    if (!propPlayers || propPlayers.length === 0) {
      apiClient.getPlayers().then((data) => {
        if (mounted) setPlayers(data)
      }).catch(() => {})
    }

    return () => {
      mounted = false
    }
  }, [match.id, propTeams, propPlayers])

  const effectiveTeamAId = teamAId !== '' ? teamAId : (currentMatch.teamAId ? Number(currentMatch.teamAId) : null)
  const effectiveTeamBId = teamBId !== '' ? teamBId : (currentMatch.teamBId ? Number(currentMatch.teamBId) : null)

  const matchPlayers = players.filter((p) => {
    if (!p.teamId) return false
    return Number(p.teamId) === effectiveTeamAId || Number(p.teamId) === effectiveTeamBId
  })

  const handleSaveMatch = async () => {
    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      let finalWinnerId = winnerId !== '' ? Number(winnerId) : null
      if (!finalWinnerId && status === 'FINISHED' && effectiveTeamAId && effectiveTeamBId) {
        if (scoreA > scoreB) finalWinnerId = effectiveTeamAId
        else if (scoreB > scoreA) finalWinnerId = effectiveTeamBId
      }

      const payload: Record<string, unknown> = {
        score_a: scoreA,
        score_b: scoreB,
        status,
        map_name: mapName,
        match_format: matchFormat,
        date: date || undefined,
        start_time: startTime || undefined,
        round_name: roundName || undefined,
      }

      if (teamAId !== '') payload.team_a_id = Number(teamAId)
      if (teamBId !== '') payload.team_b_id = Number(teamBId)

      if (finalWinnerId) {
        payload.winner_id = finalWinnerId
        if (effectiveTeamAId && effectiveTeamBId) {
          payload.loser_id = finalWinnerId === effectiveTeamAId ? effectiveTeamBId : effectiveTeamAId
        }
      } else if (status !== 'FINISHED') {
        payload.winner_id = null
        payload.loser_id = null
      }

      const updated = await apiClient.updateMatch(currentMatch.id, payload)
      setCurrentMatch(updated)
      setSuccessMsg('Match updated successfully!')
      onSuccess(updated)
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddMap = async () => {
    setErrorMsg(null)
    try {
      const mapWinnerId =
        newMapScoreA > newMapScoreB
          ? effectiveTeamAId
          : newMapScoreB > newMapScoreA
            ? effectiveTeamBId
            : null

      await apiClient.addMatchMap(currentMatch.id, {
        map_number: newMapNumber,
        map_name: newMapName,
        score_a: newMapScoreA,
        score_b: newMapScoreB,
        winner_id: mapWinnerId,
      })

      const fresh = await apiClient.getMatch(currentMatch.id)
      setCurrentMatch(fresh)
      setNewMapNumber((fresh.mapResults?.length ?? 0) + 1)
      setSuccessMsg(`Map ${newMapName} added!`)
      onSuccess(fresh)
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    }
  }

  const handleDeleteMap = async (mapId: number) => {
    setErrorMsg(null)
    try {
      await apiClient.deleteMatchMap(currentMatch.id, mapId)
      const fresh = await apiClient.getMatch(currentMatch.id)
      setCurrentMatch(fresh)
      setNewMapNumber((fresh.mapResults?.length ?? 0) + 1)
      onSuccess(fresh)
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    }
  }

  const handleAddPlayerStat = async () => {
    if (!newStatPlayerId) return
    setErrorMsg(null)

    const selectedPlayer = players.find((p) => Number(p.id) === newStatPlayerId)
    if (!selectedPlayer || !selectedPlayer.teamId) {
      setErrorMsg('Selected player is not assigned to a team')
      return
    }

    try {
      await apiClient.addPlayerMatchStat(currentMatch.id, {
        player_id: newStatPlayerId,
        team_id: Number(selectedPlayer.teamId),
        kills: newStatKills,
        deaths: newStatDeaths,
        assists: newStatAssists,
        headshots: 0,
        adr: newStatAdr,
        kast: 70.0,
        rating: newStatRating,
        is_mvp: newStatRating >= 1.35,
      })

      const fresh = await apiClient.getMatch(currentMatch.id)
      setCurrentMatch(fresh)
      setSuccessMsg(`Stat recorded for ${selectedPlayer.nickname || selectedPlayer.name}!`)
      onSuccess(fresh)
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    }
  }

  const handleDeletePlayerStat = async (statId: number) => {
    setErrorMsg(null)
    try {
      await apiClient.deletePlayerMatchStat(currentMatch.id, statId)
      const fresh = await apiClient.getMatch(currentMatch.id)
      setCurrentMatch(fresh)
      onSuccess(fresh)
    } catch (err) {
      setErrorMsg(getErrorMessage(err))
    }
  }

  return (
    <Box>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: '#fff', py: 2 }}>
        <Typography variant="h2" sx={{ color: '#fff', fontSize: 16 }}>
          Edit Match #{currentMatch.id}: {currentMatch.teamA} vs {currentMatch.teamB}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {errorMsg ? (
            <Alert severity="error" onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          ) : null}
          {successMsg ? (
            <Alert severity="success" onClose={() => setSuccessMsg(null)}>
              {successMsg}
            </Alert>
          ) : null}

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
            Match Configuration & Participants
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-match-team-a-label">Team A</InputLabel>
                <Select
                  labelId="edit-match-team-a-label"
                  value={teamAId}
                  label="Team A"
                  onChange={(e) => setTeamAId(Number(e.target.value))}
                >
                  {teams.map((t) => (
                    <MenuItem key={t.id} value={Number(t.id)}>
                      {t.name} ({t.shortName})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-match-team-b-label">Team B</InputLabel>
                <Select
                  labelId="edit-match-team-b-label"
                  value={teamBId}
                  label="Team B"
                  onChange={(e) => setTeamBId(Number(e.target.value))}
                >
                  {teams.map((t) => (
                    <MenuItem key={t.id} value={Number(t.id)}>
                      {t.name} ({t.shortName})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Score Team A"
                type="number"
                size="small"
                slotProps={{ htmlInput: { min: 0 } }}
                value={scoreA}
                onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value, 10) || 0))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Score Team B"
                type="number"
                size="small"
                slotProps={{ htmlInput: { min: 0 } }}
                value={scoreB}
                onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value, 10) || 0))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-match-status-label">Status</InputLabel>
                <Select
                  labelId="edit-match-status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as MatchStatus)}
                >
                  {MATCH_STATUSES.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-match-format-label">Series Format</InputLabel>
                <Select
                  labelId="edit-match-format-label"
                  value={matchFormat}
                  label="Series Format"
                  onChange={(e) => setMatchFormat(e.target.value as MatchFormat)}
                >
                  {MATCH_FORMATS.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Match Date"
                type="date"
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Start Time / Day"
                placeholder="e.g. 19:00 Friday"
                size="small"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Round / Stage Name"
                placeholder="e.g. Upper Final"
                size="small"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-match-map-label">Default / Current Map</InputLabel>
                <Select
                  labelId="edit-match-map-label"
                  value={mapName}
                  label="Default / Current Map"
                  onChange={(e) => setMapName(e.target.value)}
                >
                  {CS_MAPS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="edit-match-winner-label">Winner Team</InputLabel>
                <Select
                  labelId="edit-match-winner-label"
                  value={winnerId}
                  label="Winner Team"
                  onChange={(e) => setWinnerId(String(e.target.value) === '' ? '' : Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>None (Ongoing / Upcoming)</em>
                  </MenuItem>
                  {effectiveTeamAId ? (
                    <MenuItem value={effectiveTeamAId}>
                      {teams.find((t) => Number(t.id) === effectiveTeamAId)?.name || currentMatch.teamA}
                    </MenuItem>
                  ) : null}
                  {effectiveTeamBId ? (
                    <MenuItem value={effectiveTeamBId}>
                      {teams.find((t) => Number(t.id) === effectiveTeamBId)?.name || currentMatch.teamB}
                    </MenuItem>
                  ) : null}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={handleSaveMatch}
            disabled={isSaving}
            sx={{
              bgcolor: '#f04b3a',
              color: '#fff',
              fontWeight: 700,
              alignSelf: 'flex-start',
              '&:hover': { bgcolor: '#d93b2a' },
            }}
          >
            {isSaving ? 'Saving...' : 'Save Match Settings'}
          </Button>

          <Divider sx={{ my: 1 }} />

          {/* Maps Breakdown */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
            Map Results Breakdown (BO3 / BO5)
          </Typography>

          {currentMatch.mapResults && currentMatch.mapResults.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Map</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Winner</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentMatch.mapResults.map((map) => (
                    <TableRow key={map.id} hover>
                      <TableCell>Map {map.mapNumber}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{map.mapName}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>
                        {map.scoreA} : {map.scoreB}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={map.winnerName || (map.winnerId === effectiveTeamAId ? currentMatch.teamA : currentMatch.teamB) || 'TBD'}
                          size="small"
                          color={map.winnerId ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMap(map.id)}
                          aria-label="Delete map"
                        >
                          ✕
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No individual maps recorded yet.
            </Typography>
          )}

          {/* Add map row */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1.5 }}>
              + Add Map Outcome
            </Typography>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 4, sm: 2 }}>
                <TextField
                  label="Map #"
                  type="number"
                  size="small"
                  value={newMapNumber}
                  onChange={(e) => setNewMapNumber(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 8, sm: 3 }}>
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
              <Grid size={{ xs: 6, sm: 2.5 }}>
                <TextField
                  label={`${currentMatch.teamA} Score`}
                  type="number"
                  size="small"
                  value={newMapScoreA}
                  onChange={(e) => setNewMapScoreA(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2.5 }}>
                <TextField
                  label={`${currentMatch.teamB} Score`}
                  type="number"
                  size="small"
                  value={newMapScoreB}
                  onChange={(e) => setNewMapScoreB(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleAddMap}
                  fullWidth
                  sx={{ bgcolor: '#242832', color: '#fff', '&:hover': { bgcolor: '#1a1d24' }, height: 40 }}
                >
                  + Add Map
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Divider sx={{ my: 1 }} />

          {/* Player Statistics */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
            HLTV Player Match Statistics
          </Typography>

          {currentMatch.playerStats && currentMatch.playerStats.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Player</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Team</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>K - D</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>ADR</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Rating</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentMatch.playerStats.map((stat) => (
                    <TableRow key={stat.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{stat.playerNickname}</TableCell>
                      <TableCell>{stat.teamName}</TableCell>
                      <TableCell align="center">
                        {stat.kills} - {stat.deaths}
                      </TableCell>
                      <TableCell align="center">{stat.adr}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>
                        {stat.rating != null ? stat.rating.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePlayerStat(stat.id)}
                          aria-label="Delete player stat"
                        >
                          ✕
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No player statistics recorded for this match yet.
            </Typography>
          )}

          {/* Record Player Stat Form */}
          {matchPlayers.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1.5 }}>
                + Record Player Stat
              </Typography>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="edit-stat-player-select">Select Player</InputLabel>
                    <Select
                      labelId="edit-stat-player-select"
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
                <Grid size={{ xs: 4, sm: 1.5 }}>
                  <TextField
                    label="Kills"
                    type="number"
                    size="small"
                    value={newStatKills}
                    onChange={(e) => setNewStatKills(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 1.5 }}>
                  <TextField
                    label="Deaths"
                    type="number"
                    size="small"
                    value={newStatDeaths}
                    onChange={(e) => setNewStatDeaths(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 4, sm: 1.5 }}>
                  <TextField
                    label="Assists"
                    type="number"
                    size="small"
                    value={newStatAssists}
                    onChange={(e) => setNewStatAssists(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.5 }}>
                  <TextField
                    label="ADR"
                    type="number"
                    size="small"
                    value={newStatAdr}
                    onChange={(e) => setNewStatAdr(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 1.5 }}>
                  <TextField
                    label="Rating"
                    type="number"
                    size="small"
                    value={newStatRating}
                    onChange={(e) => setNewStatRating(Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 1.5 }}>
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
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Box>
  )
}

export function EditMatchDialog({
  open,
  match,
  availableTeams,
  availablePlayers,
  onClose,
  onSuccess,
}: EditMatchDialogProps) {
  if (!match) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <EditMatchFormContent
        key={match.id}
        match={match}
        availableTeams={availableTeams}
        availablePlayers={availablePlayers}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Dialog>
  )
}
