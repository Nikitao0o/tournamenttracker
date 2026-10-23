import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { useTournaments } from '../../app/providers/useTournaments'
import { TournamentStatusLabel } from '../../components/StatusChips'
import { DeleteConfirmDialog } from '../../features/manage-tournaments/ui/DeleteConfirmDialog'
import { TournamentFormDialog } from '../../features/manage-tournaments/ui/TournamentFormDialog'
import { CreateTeamDialog } from '../../features/manage-teams/ui/CreateTeamDialog'
import { EditTeamDialog } from '../../features/manage-teams/ui/EditTeamDialog'
import { CreatePlayerDialog } from '../../features/manage-players/ui/CreatePlayerDialog'
import { EditPlayerDialog } from '../../features/manage-players/ui/EditPlayerDialog'
import { MediaUploadDialog } from '../../features/manage-media/ui/MediaUploadDialog'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ErrorAlert } from '../../shared/ui/ErrorAlert'
import { TableRowSkeleton } from '../../shared/ui/LoadingSkeleton'
import { TeamLogo } from '../../shared/ui/TeamLogo'
import { PlayerAvatar } from '../../shared/ui/PlayerAvatar'
import { formatDate } from '../../utils/formatting'
import { storage } from '../../shared/api/storage'
import { MOCK_TEAMS, MOCK_PLAYERS } from '../../mock/data'
import type {
  CreateTournamentInput,
  Tournament,
  UpdateTournamentInput,
  CreateTeamInput,
  CreatePlayerInput,
  Team,
  Player,
} from '../../types'

export function AdminPage() {
  const { tournaments, isLoading, error, createTournament, updateTournament, deleteTournament, refreshTournaments } =
    useTournaments()

  const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'players'>('tournaments')
  const [search, setSearch] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')

  // Teams & Players state with storage persistence
  const [teams, setTeams] = useState<Team[]>(() => storage.getTeams() || MOCK_TEAMS)
  const [players, setPlayers] = useState<Player[]>(() => storage.getPlayers() || MOCK_PLAYERS)

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false)
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false)
  const [editPlayerDialogOpen, setEditPlayerDialogOpen] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null)

  // Media upload modal state (for quick avatar or team logo changes)
  const [mediaModal, setMediaModal] = useState<{
    open: boolean
    type: 'team' | 'player'
    name: string
  }>({
    open: false,
    type: 'team',
    name: '',
  })

  const [, setMediaVersion] = useState(0)
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const handleOpenCreate = () => {
    setEditingTournament(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (t: Tournament) => {
    setEditingTournament(t)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: CreateTournamentInput) => {
    try {
      if (editingTournament) {
        await updateTournament(editingTournament.id, data as UpdateTournamentInput)
        setNotification({ message: `Tournament "${data.title}" updated successfully!`, severity: 'success' })
      } else {
        await createTournament(data)
        setNotification({ message: `Tournament "${data.title}" created successfully!`, severity: 'success' })
      }
    } catch (err: unknown) {
      setNotification({
        message: err instanceof Error ? err.message : 'An error occurred while saving the tournament',
        severity: 'error',
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTournament) return
    try {
      const title = deletingTournament.title
      await deleteTournament(deletingTournament.id)
      setNotification({ message: `Tournament "${title}" deleted successfully`, severity: 'success' })
    } catch (err: unknown) {
      setNotification({
        message: err instanceof Error ? err.message : 'Error while deleting tournament',
        severity: 'error',
      })
    } finally {
      setDeletingTournament(null)
    }
  }

  const handleCreateTeam = (input: CreateTeamInput) => {
    const slug = input.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const newTeam: Team = {
      id: `team-${slug}-${Date.now()}`,
      name: input.name,
      shortName: input.shortName,
      region: input.region,
      coach: input.coach,
      description: input.description,
      ranking: input.ranking,
      roster: input.roster || [],
      logoUrl: input.logoUrl,
    }
    if (input.logoUrl) {
      storage.setTeamLogo(newTeam.name, input.logoUrl)
    }
    const updated = [newTeam, ...teams]
    setTeams(updated)
    storage.setTeams(updated)
    setTeamDialogOpen(false)
    setNotification({ message: `Team "${newTeam.name}" created successfully!`, severity: 'success' })
  }

  const handleOpenEditTeam = (t: Team) => {
    setEditingTeam(t)
    setEditTeamDialogOpen(true)
  }

  const handleUpdateTeam = (updatedTeam: Team) => {
    if (updatedTeam.logoUrl) {
      storage.setTeamLogo(updatedTeam.name, updatedTeam.logoUrl)
    }
    const updated = teams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t))
    setTeams(updated)
    storage.setTeams(updated)
    setEditTeamDialogOpen(false)
    setNotification({ message: `Team "${updatedTeam.name}" updated successfully!`, severity: 'success' })
  }

  const handleCreatePlayer = (input: CreatePlayerInput) => {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const newPlayer: Player = {
      id: input.id || `player-${slug}-${Date.now()}`,
      name: input.name,
      birthDate: input.birthDate,
      age: input.age ?? 20,
      role: input.role,
      nationality: input.nationality,
      teamId: input.teamId,
      teamName: input.teamName,
      avatarUrl: input.avatarUrl,
      stats: input.stats || { kd: '1.00', impact: 1.0, maps: 0 },
    }
    if (input.avatarUrl) {
      storage.setPlayerAvatar(newPlayer.name, input.avatarUrl)
    }
    const updated = [newPlayer, ...players]
    setPlayers(updated)
    storage.setPlayers(updated)
    setPlayerDialogOpen(false)
    setNotification({ message: `Player "${newPlayer.name}" created successfully!`, severity: 'success' })
  }

  const handleOpenEditPlayer = (p: Player) => {
    setEditingPlayer(p)
    setEditPlayerDialogOpen(true)
  }

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    if (updatedPlayer.avatarUrl) {
      storage.setPlayerAvatar(updatedPlayer.name, updatedPlayer.avatarUrl)
    }
    const updated = players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    setPlayers(updated)
    storage.setPlayers(updated)
    setEditPlayerDialogOpen(false)
    setNotification({ message: `Player "${updatedPlayer.name}" updated successfully!`, severity: 'success' })
  }

  const handleSaveMedia = (dataUrl: string) => {
    if (mediaModal.type === 'team') {
      storage.setTeamLogo(mediaModal.name, dataUrl)
      setNotification({ message: `Team logo for "${mediaModal.name}" updated successfully!`, severity: 'success' })
    } else {
      storage.setPlayerAvatar(mediaModal.name, dataUrl)
      setNotification({ message: `Player avatar for "${mediaModal.name}" updated successfully!`, severity: 'success' })
    }
    setMediaVersion((v) => v + 1)
  }

  const handleResetMedia = (name: string, type: 'team' | 'player') => {
    if (type === 'team') {
      storage.removeTeamLogo(name)
      setNotification({ message: `Team logo for "${name}" reset to default`, severity: 'success' })
    } else {
      storage.removePlayerAvatar(name)
      setNotification({ message: `Player avatar for "${name}" reset to default`, severity: 'success' })
    }
    setMediaVersion((v) => v + 1)
  }

  const filteredTournaments = tournaments.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      team.shortName.toLowerCase().includes(teamSearch.toLowerCase()) ||
      team.region.toLowerCase().includes(teamSearch.toLowerCase()),
  )

  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      player.role.toLowerCase().includes(playerSearch.toLowerCase()) ||
      player.nationality.toLowerCase().includes(playerSearch.toLowerCase()) ||
      player.teamName.toLowerCase().includes(playerSearch.toLowerCase()),
  )

  const countOngoing = tournaments.filter((t) => t.status === 'Ongoing').length
  const countUpcoming = tournaments.filter((t) => t.status === 'Upcoming').length
  const countCompleted = tournaments.filter((t) => t.status === 'Completed').length

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
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 2,
        }}
      >
        <div>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h1" sx={{ color: '#fff', fontSize: { xs: 18, sm: 22 } }}>
              ADMIN PANEL
            </Typography>
            <Chip label="Full Access" size="small" sx={{ bgcolor: '#f04b3a', color: '#fff', fontWeight: 800 }} />
          </Stack>
          <Typography sx={{ color: '#9aa7b3', fontSize: 12 }}>
            Manage tournaments, brackets, teams, players, and media assets
          </Typography>
        </div>

        {/* Global Quick Actions */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            component={Link}
            to="/admin/matches"
            variant="outlined"
            sx={{
              color: '#fff',
              borderColor: '#454c59',
              fontWeight: 800,
              fontSize: 12,
              '&:hover': { borderColor: '#f04b3a', bgcolor: 'rgba(240, 75, 58, 0.1)' },
            }}
          >
            Match Editor
          </Button>

          <Button
            component={Link}
            to="/admin/bracket"
            variant="outlined"
            sx={{
              color: '#fff',
              borderColor: '#454c59',
              fontWeight: 800,
              fontSize: 12,
              '&:hover': { borderColor: '#f04b3a', bgcolor: 'rgba(240, 75, 58, 0.1)' },
            }}
          >
            Bracket Editor
          </Button>

          <Button
            variant="contained"
            onClick={() => setTeamDialogOpen(true)}
            sx={{
              bgcolor: '#0288d1',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              '&:hover': { bgcolor: '#0277bd' },
            }}
          >
            + Create Team
          </Button>

          <Button
            variant="contained"
            onClick={() => setPlayerDialogOpen(true)}
            sx={{
              bgcolor: '#2e7d32',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              '&:hover': { bgcolor: '#1b5e20' },
            }}
          >
            + Create Player
          </Button>

          <Button
            variant="contained"
            onClick={handleOpenCreate}
            sx={{
              bgcolor: '#f04b3a',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
              '&:hover': { bgcolor: '#d93b2a' },
            }}
          >
            + Create Tournament
          </Button>
        </Stack>
      </Box>

      {/* Tabs navigation: Tournaments, Teams, Players */}
      <Paper variant="outlined" sx={{ bgcolor: '#fff' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 800, fontSize: 13 },
            '& .Mui-selected': { color: 'primary.main' },
          }}
        >
          <Tab value="tournaments" label="Tournaments" />
          <Tab value="teams" label="Teams Management" />
          <Tab value="players" label="Players Management" />
        </Tabs>
      </Paper>

      {/* TAB 1: TOURNAMENTS */}
      {activeTab === 'tournaments' && (
        <>
          {/* Quick stats */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
              <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                Total Tournaments
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 800, mt: 0.5 }}>{tournaments.length}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
              <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                Ongoing
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'error.main', mt: 0.5 }}>
                {countOngoing}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
              <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                Upcoming
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                {countUpcoming}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#fff' }}>
              <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                Completed
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'text.secondary', mt: 0.5 }}>
                {countCompleted}
              </Typography>
            </Paper>
          </Stack>

          {error ? <ErrorAlert message={error} onRetry={refreshTournaments} /> : null}

          {/* Search bar */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <TextField
              placeholder="Search tournaments..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: { bgcolor: 'background.default' },
                },
              }}
            />
          </Paper>

          {/* Tournaments table */}
          <TableContainer component={Paper} variant="outlined">
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'secondary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>TOURNAMENT NAME</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>LOCATION</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>PRIZE POOL</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>DATES</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ p: 2 }}>
                      <TableRowSkeleton count={4} />
                    </TableCell>
                  </TableRow>
                ) : filteredTournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ p: 0 }}>
                      <EmptyState
                        title="No tournaments found"
                        description="No tournaments match your current search criteria."
                        actionLabel="+ Create Tournament"
                        onAction={handleOpenCreate}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTournaments.map((t) => (
                    <TableRow
                      key={t.id}
                      hover
                      sx={{
                        transition: 'background-color 150ms',
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell>
                        <Typography
                          component={Link}
                          to={`/tournaments/${t.id}`}
                          sx={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: 'text.primary',
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                          }}
                        >
                          {t.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{t.location}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{t.prizePool}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {formatDate(t.startDate)} — {formatDate(t.endDate)}
                      </TableCell>
                      <TableCell>
                        <TournamentStatusLabel status={t.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                          <Button
                            component={Link}
                            to={`/admin/tournaments/${t.id}/bracket`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11, py: 0.4, px: 1, borderColor: '#ffb300', color: '#ffb300' }}
                          >
                            Bracket
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenEdit(t)}
                            sx={{ fontSize: 11, py: 0.4, px: 1 }}
                          >
                            Edit
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeletingTournament(t)}
                            aria-label="Delete tournament"
                            sx={{ borderRadius: 0.5 }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* TAB 2: TEAMS MANAGEMENT */}
      {activeTab === 'teams' && (
        <Stack spacing={2.5}>
          {/* Teams search & actions bar */}
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search team by name, short tag, or region..."
              size="small"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: { bgcolor: 'background.default' },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => setTeamDialogOpen(true)}
              sx={{
                bgcolor: '#0288d1',
                color: '#fff',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                px: 2.5,
                '&:hover': { bgcolor: '#0277bd' },
              }}
            >
              + Add Team
            </Button>
          </Paper>

          {/* Teams table */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h2" sx={{ fontSize: 18 }}>
                Teams List ({filteredTeams.length})
              </Typography>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>LOGO</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>TEAM NAME</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>TAG</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>REGION</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>COACH</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTeams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        No teams match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeams.map((team) => (
                      <TableRow key={team.id} hover>
                        <TableCell>
                          <TeamLogo teamName={team.name} logoUrl={team.logoUrl} size={32} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Typography
                            component={Link}
                            to={`/teams/${team.id}`}
                            sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}
                          >
                            {team.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={team.shortName} size="small" />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{team.region}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{team.coach || '—'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenEditTeam(team)}
                              sx={{ fontSize: 11, borderColor: '#0288d1', color: '#0288d1' }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setMediaModal({ open: true, type: 'team', name: team.name })}
                              sx={{ fontSize: 11 }}
                            >
                              Change Logo
                            </Button>
                            <Button
                              component={Link}
                              to={`/teams/${team.id}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            >
                              View Team
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      )}

      {/* TAB 3: PLAYERS MANAGEMENT (Stats removed from table, Edit Player added) */}
      {activeTab === 'players' && (
        <Stack spacing={2.5}>
          {/* Players search & actions bar */}
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search player by nickname, team, role, or nationality..."
              size="small"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  sx: { bgcolor: 'background.default' },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => setPlayerDialogOpen(true)}
              sx={{
                bgcolor: '#2e7d32',
                color: '#fff',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                px: 2.5,
                '&:hover': { bgcolor: '#1b5e20' },
              }}
            >
              + Add Player
            </Button>
          </Paper>

          {/* Players table without statistics */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h2" sx={{ fontSize: 18 }}>
                Players List ({filteredPlayers.length})
              </Typography>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>AVATAR</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>PLAYER</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>AGE</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>TEAM</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>ROLE</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>NATIONALITY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        No players match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id} hover>
                        <TableCell>
                          <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} teamId={player.teamId} size={34} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Typography
                            component={Link}
                            to={`/players/${player.id}`}
                            sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}
                          >
                            {player.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{player.age}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{player.teamName}</TableCell>
                        <TableCell>
                          <Chip label={player.role} size="small" />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{player.nationality}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenEditPlayer(player)}
                              sx={{ fontSize: 11, borderColor: '#0288d1', color: '#0288d1' }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setMediaModal({ open: true, type: 'player', name: player.name })}
                              sx={{ fontSize: 11 }}
                            >
                              Avatar
                            </Button>
                            <Button
                              component={Link}
                              to={`/players/${player.id}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11 }}
                            >
                              View
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      )}

      {/* Create / Edit Tournament Dialog */}
      <TournamentFormDialog
        open={formOpen}
        tournament={editingTournament}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Create Team Dialog */}
      <CreateTeamDialog
        open={teamDialogOpen}
        onClose={() => setTeamDialogOpen(false)}
        onSubmit={handleCreateTeam}
      />

      {/* Edit Team Dialog */}
      <EditTeamDialog
        open={editTeamDialogOpen}
        team={editingTeam}
        onClose={() => setEditTeamDialogOpen(false)}
        onSubmit={handleUpdateTeam}
      />

      {/* Create Player Dialog */}
      <CreatePlayerDialog
        open={playerDialogOpen}
        availableTeams={teams}
        onClose={() => setPlayerDialogOpen(false)}
        onSubmit={handleCreatePlayer}
      />

      {/* Edit Player Dialog */}
      <EditPlayerDialog
        open={editPlayerDialogOpen}
        player={editingPlayer}
        availableTeams={teams}
        onClose={() => setEditPlayerDialogOpen(false)}
        onSubmit={handleUpdatePlayer}
      />

      {/* Delete Tournament Confirm Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deletingTournament)}
        title={deletingTournament?.title}
        onClose={() => setDeletingTournament(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Media Upload Dialog (PNG / JPG) */}
      <MediaUploadDialog
        open={mediaModal.open}
        title={`Upload ${mediaModal.type === 'team' ? 'team logo' : 'player avatar'} (PNG / JPG)`}
        entityName={mediaModal.name}
        currentValue={
          mediaModal.type === 'team'
            ? storage.getTeamLogo(mediaModal.name) || undefined
            : storage.getPlayerAvatar(mediaModal.name) || undefined
        }
        onClose={() => setMediaModal({ open: false, type: 'team', name: '' })}
        onSave={handleSaveMedia}
        onReset={() => handleResetMedia(mediaModal.name, mediaModal.type)}
      />

      {/* Toast Notification */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
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
